import { h, render } from 'vue';
import { Facet, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state';
import { EditorView, type Panel } from '@codemirror/view';
import { Decoration } from '@codemirror/view';
import CustomSearchPanel from '@/components/CustomSearchPanel.vue';
import type { SearchMatch, StructuralSearchProvider } from '@/composables/search/StructuralSearchProvider';
import { CssSelectorProvider } from '@/composables/search/providers/CssSelectorProvider';
// Providers
import { JsonPathProvider } from '@/composables/search/providers/JsonPathProvider';
import { XPathProvider } from '@/composables/search/providers/XPathProvider';
import type { FileType } from '@/utils/fileType';

export const fileTypeFacet = Facet.define<FileType, FileType>({
  combine: (values) => values[values.length - 1] || 'html',
});

export const providers: StructuralSearchProvider[] = [
  new JsonPathProvider(),
  new CssSelectorProvider(),
  new XPathProvider(),
];

export const setStructuralSearchState = StateEffect.define<{
  query: string;
  providerId: string | null;
  matches: SearchMatch[];
  selectedIndex: number;
  error: string | null;
}>();

export interface StructuralSearchState {
  query: string;
  providerId: string | null;
  matches: SearchMatch[];
  selectedIndex: number;
  error: string | null;
}

const matchMark = Decoration.mark({ class: 'cm-searchMatch' });
const selectedMatchMark = Decoration.mark({ class: 'cm-searchMatch cm-searchMatch-selected' });

export const structuralSearchField = StateField.define<StructuralSearchState>({
  create() {
    return { query: '', providerId: null, matches: [], selectedIndex: -1, error: null };
  },
  update(value, tr) {
    let next = value;
    for (const effect of tr.effects) {
      if (effect.is(setStructuralSearchState)) {
        next = effect.value;
      }
    }
    // Note: If document changes (tr.docChanged), we should ideally re-run the search.
    // For simplicity, we let the Vue panel listen to changes and re-trigger the search.
    return next;
  },
  provide(field) {
    return EditorView.decorations.from(field, (value) => {
      const builder = new RangeSetBuilder<Decoration>();
      if (!value.providerId || value.matches.length === 0) return builder.finish();

      const sorted = [...value.matches].sort((a, b) => a.from - b.from);
      for (let i = 0; i < sorted.length; i++) {
        const m = sorted[i];
        if (i === value.selectedIndex) {
          builder.add(m.from, m.to, selectedMatchMark);
        } else {
          builder.add(m.from, m.to, matchMark);
        }
      }
      return builder.finish();
    });
  },
});

export function createStructuralSearchPanel(view: EditorView): Panel {
  const dom = document.createElement('div');
  dom.className = 'cm-search'; // Use CodeMirror's native search class for theme inheritance

  // Render the Vue component inside the DOM element.
  // We pass the EditorView so the component can read and dispatch to the state.
  const vnode = h(CustomSearchPanel, { view });
  render(vnode, dom);

  return {
    top: true,
    dom,
    destroy() {
      render(null, dom); // Unmount Vue component
    },
  };
}

export function performStructuralSearch(view: EditorView, providerId: string, query: string) {
  const provider = providers.find((p) => p.id === providerId);
  if (!provider || !query.trim()) {
    view.dispatch({
      effects: setStructuralSearchState.of({ query, providerId, matches: [], selectedIndex: -1, error: null }),
    });
    return;
  }

  const text = view.state.doc.toString();
  try {
    const fileType = view.state.facet(fileTypeFacet);
    const matches = provider.search(text, query, fileType);
    view.dispatch({
      effects: setStructuralSearchState.of({
        query,
        providerId,
        matches,
        selectedIndex: matches.length > 0 ? 0 : -1,
        error: null,
      }),
    });

    // Scroll to first match
    if (matches.length > 0) {
      view.dispatch({
        selection: { anchor: matches[0].from, head: matches[0].to },
        effects: EditorView.scrollIntoView(matches[0].from, { y: 'center' }),
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    view.dispatch({
      effects: setStructuralSearchState.of({ query, providerId, matches: [], selectedIndex: -1, error: message }),
    });
  }
}

export function nextStructuralMatch(view: EditorView) {
  const state = view.state.field(structuralSearchField);
  if (state.matches.length === 0) return;

  const nextIndex = (state.selectedIndex + 1) % state.matches.length;
  view.dispatch({
    effects: setStructuralSearchState.of({ ...state, selectedIndex: nextIndex }),
  });

  const match = state.matches[nextIndex];
  view.dispatch({
    selection: { anchor: match.from, head: match.to },
    effects: EditorView.scrollIntoView(match.from, { y: 'center' }),
  });
}

export function previousStructuralMatch(view: EditorView) {
  const state = view.state.field(structuralSearchField);
  if (state.matches.length === 0) return;

  const prevIndex = (state.selectedIndex - 1 + state.matches.length) % state.matches.length;
  view.dispatch({
    effects: setStructuralSearchState.of({ ...state, selectedIndex: prevIndex }),
  });

  const match = state.matches[prevIndex];
  view.dispatch({
    selection: { anchor: match.from, head: match.to },
    effects: EditorView.scrollIntoView(match.from, { y: 'center' }),
  });
}
