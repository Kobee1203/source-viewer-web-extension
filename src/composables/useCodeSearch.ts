import { onMounted, onUnmounted, shallowRef } from 'vue';
import { EditorView } from '@codemirror/view';
import { EditorState, type Extension } from '@codemirror/state';
import { search, openSearchPanel, setSearchQuery, getSearchQuery } from '@codemirror/search';
import { t } from '@/utils/i18n';

/**
 * Full-document search for the code viewer, bound to the OS find shortcut.
 *
 * Returns the CodeMirror extensions to install, an `onReady` handler to capture the view, and an
 * `openSearch` command (used by the toolbar button). The editor is `disabled` (not focusable), so
 * CodeMirror's own Mod-f keymap never fires — we intercept Cmd/Ctrl-F on the window in the capture
 * phase and open the panel ourselves. In the in-place viewer this listener lives in the iframe
 * document, so it only fires when the iframe has focus.
 */
export function useCodeSearch(): {
  searchExtensions: Extension;
  onReady: (payload: { view: EditorView }) => void;
  openSearch: () => void;
} {
  const view = shallowRef<EditorView>();

  // Localize the panel labels to the UI locale. Replace-related phrases are omitted: the panel
  // hides them in read-only mode. Built once — the UI locale is fixed for the session.
  const phrases = EditorState.phrases.of({
    Find: t('searchFind'),
    next: t('searchNext'),
    previous: t('searchPrevious'),
    all: t('searchAll'),
    'match case': t('searchMatchCase'),
    regexp: t('searchRegexp'),
    'by word': t('searchByWord'),
    close: t('searchClose'),
  });

  // Jump to the first match as the query is typed (incremental, browser-find-like) instead of only
  // on Enter/next. Searches from the current selection so refining the query stays near the current
  // spot, wrapping to the document start otherwise. Dispatched in a microtask because a transaction
  // can't be dispatched from within an update; the scroll/selection carries no setSearchQuery
  // effect so it can't re-trigger this listener.
  const scrollToMatchOnQuery = EditorView.updateListener.of((update) => {
    if (!update.transactions.some((tr) => tr.effects.some((e) => e.is(setSearchQuery)))) return;
    const query = getSearchQuery(update.state);
    if (!query.search || !query.valid) return;
    let match = query.getCursor(update.state, update.state.selection.main.from).next();
    if (match.done) match = query.getCursor(update.state, 0).next();
    if (match.done) return;
    const { from, to } = match.value;
    queueMicrotask(() => {
      if (update.view.dom.isConnected) {
        update.view.dispatch({
          selection: { anchor: from, head: to },
          effects: EditorView.scrollIntoView(from, { y: 'center' }),
        });
      }
    });
  });

  // `search({ top: true })` places the panel above the content (more visible than at the bottom)
  // and installs the search state field up front.
  const searchExtensions: Extension = [search({ top: true }), phrases, scrollToMatchOnQuery];

  function onReady(payload: { view: EditorView }): void {
    view.value = payload.view;
  }

  function openSearch(): void {
    if (view.value) openSearchPanel(view.value);
  }

  function onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && !event.altKey && event.key.toLowerCase() === 'f' && view.value) {
      event.preventDefault();
      openSearchPanel(view.value);
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown, true));
  onUnmounted(() => window.removeEventListener('keydown', onKeydown, true));

  return { searchExtensions, onReady, openSearch };
}
