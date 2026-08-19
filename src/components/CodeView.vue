<script setup lang="ts">
import { computed, onMounted, onUnmounted, onWatcherCleanup, shallowRef, watch } from 'vue';
import { EditorState, type Extension } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { openSearchPanel, setSearchQuery, getSearchQuery } from '@codemirror/search';
import CodeMirror from 'vue-codemirror6';

import type { FileType } from '@/utils/fileType';
import { linkifyPlugin } from '@/utils/cm-linkify';
import { loadLanguage } from '@/utils/language';
import { DEFAULT_THEME_ID, getThemeExtension } from '@/utils/themes';
import { t } from '@/utils/i18n';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
  themeId?: string;
  themeType?: string;
}>();

// The language support is loaded on demand (each @codemirror/lang-* is its own chunk).
const langSupport = shallowRef<Extension>([]);
watch(
  () => props.language,
  async (language) => {
    let stale = false;
    onWatcherCleanup(() => (stale = true));
    const support = await loadLanguage(language);
    if (!stale) langSupport.value = support;
  },
  { immediate: true },
);

// The theme extension is loaded on demand (each theme is its own lazy chunk).
// The cleanup marks an in-flight load as stale so a slower one can't clobber a newer selection.
const themeExtension = shallowRef<Extension>([]);
watch(
  () => props.themeId ?? DEFAULT_THEME_ID,
  async (id) => {
    let stale = false;
    onWatcherCleanup(() => (stale = true));
    const ext = await getThemeExtension(id);
    if (!stale) themeExtension.value = ext;
  },
  { immediate: true },
);

// Localize CodeMirror's search-panel labels to the UI locale. Replace-related phrases are omitted:
// the panel hides them in read-only mode. Built once — the UI locale is fixed for the session.
const searchPhrases = EditorState.phrases.of({
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
// can't be dispatched from within an update; the scroll/selection carries no setSearchQuery effect
// so it can't re-trigger this listener.
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

const extensions = computed(() => [
  langSupport.value,
  themeExtension.value,
  linkifyPlugin(props.baseUrl),
  searchPhrases,
  scrollToMatchOnQuery,
]);

const linkHoverColor = computed(() => (props.themeType === 'dark' ? 'black' : 'white'));

// The editor is `disabled` (not focusable), so CodeMirror's own Mod-f keymap never fires. Intercept
// the OS find shortcut (Cmd-f / Ctrl-f) at the window level, in the capture phase, and open the
// search panel ourselves — `openSearchPanel` lazily installs the search extension on first use. In
// the in-place viewer this listener lives in the iframe document, so it only fires when the iframe
// has focus.
const view = shallowRef<EditorView>();

function onReady(payload: { view: EditorView }): void {
  view.value = payload.view;
}

/** Opens the search panel (also invoked by the toolbar's search button). */
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

defineExpose({ openSearch });
</script>

<template>
  <div class="code-view">
    <CodeMirror :model-value="code" basic readonly disabled :wrap :extensions @ready="onReady" />
  </div>
</template>

<style>
.code-view {
  height: 100%;
}

/* vue-codemirror6 wraps .cm-editor in this element with no height of its own. Without height: 100%
   here the chain to .cm-editor breaks, the editor grows with its content (the page scrolls instead
   of .cm-scroller), and the search can't scroll off-screen matches into view. */
.vue-codemirror {
  height: 100%;
}

.cm-editor {
  height: 100%;
  outline: none !important;
}

.cm-scroller {
  font-family: SFMono-Regular, Consolas, 'Liberation Mono', Menlo, Courier, monospace;
  font-size: 13px;
  line-height: 1.5;
}

.source-link {
  color: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.source-link:hover {
  color: color-mix(in srgb, currentcolor, v-bind(linkHoverColor) 30%);
  text-decoration-color: color-mix(in srgb, currentcolor, v-bind(linkHoverColor) 30%);
}

.source-link:hover span {
  color: color-mix(in srgb, currentcolor, v-bind(linkHoverColor) 0%);
}
</style>
