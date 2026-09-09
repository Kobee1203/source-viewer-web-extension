<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue';
import CodeMirror from 'vue-codemirror6';
import { EditorView } from '@codemirror/view';
import { useAsyncExtension } from '@/composables/useAsyncExtension';
import { useCodeSearch } from '@/composables/useCodeSearch';
import { linkifyPlugin } from '@/utils/cm-linkify';
import type { FileType } from '@/utils/fileType';
import { loadLanguage } from '@/utils/language';
import { DEFAULT_THEME_ID, getThemeExtension } from '@/utils/themes';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
  themeId?: string;
  themeType?: string;
  fontSize: number;
}>();

// Language support and theme are each their own lazy chunk, loaded on demand (see useAsyncExtension).
const { extension: langSupport } = useAsyncExtension(() => props.language, loadLanguage);
const { extension: themeExtension, loaded: themeLoaded } = useAsyncExtension(
  () => props.themeId ?? DEFAULT_THEME_ID,
  getThemeExtension,
);

// Wait for initial theme to load before mounting CodeMirror, avoiding an unstyled text flash.
const initialReady = ref(false);
watchEffect(() => {
  if (themeLoaded.value) {
    initialReady.value = true;
  }
});

const { searchExtensions, onReady, openSearch } = useCodeSearch(props.language);

const editorView = shallowRef<EditorView>();

function handleReady(payload: { view: EditorView }): void {
  editorView.value = payload.view;
  onReady(payload);
  payload.view.scrollDOM.focus();
}

function onClick(event: MouseEvent): void {
  if ((event.target as HTMLElement | null)?.closest('.cm-panels')) return;
  editorView.value?.scrollDOM.focus();
}

const fontSizeExtension = computed(() => {
  return EditorView.theme({ '&': { fontSize: `${props.fontSize}px` } });
});

const extensions = computed(() => [
  langSupport.value,
  themeExtension.value,
  linkifyPlugin(props.baseUrl),
  searchExtensions,
  fontSizeExtension.value,
]);

const linkHoverColor = computed(() => (props.themeType === 'dark' ? 'black' : 'white'));

defineExpose({ openSearch });
</script>

<template>
  <div class="code-view" @click="onClick">
    <CodeMirror
      v-if="initialReady"
      :model-value="code"
      basic
      readonly
      disabled
      :wrap
      :extensions
      @ready="handleReady"
    />
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
  outline: none !important;
}

/* Search panel — styled to match the app toolbar. It renders inside CodeMirror's DOM, so these
   rules override CM's base/theme styles; the .cm-panels background/border use !important to stay
   consistent across all 45 editor themes (which each set their own panel colors). */
.cm-editor .cm-panels {
  color: var(--app-fg) !important;
  background: var(--toolbar-bg) !important;
  border-color: var(--toolbar-border) !important;
}

.cm-editor .cm-panels.cm-panels-top {
  border-bottom: 1px solid var(--toolbar-border);
}

.cm-editor .cm-panel.cm-search {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 7px 30px 7px 8px;
  font-family: inherit;
  font-size: 13px;
}

.cm-editor .cm-search .cm-textfield {
  height: 28px;
  padding: 0 8px;
  margin: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.cm-editor .cm-search .cm-button {
  height: 28px;
  padding: 0 10px;
  margin: 0;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  cursor: pointer;
  background: var(--btn-bg);
  background-image: none;
  border: 1px solid var(--btn-border);
  border-radius: 5px;
}

.cm-editor .cm-search .cm-button:hover {
  background: var(--btn-bg-hover);
}

.cm-editor .cm-search label {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
}

.cm-editor .cm-search [name='close'] {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 0 6px;
  font-size: 18px;
  line-height: 1;
  color: var(--app-fg);
  cursor: pointer;
  background: transparent;
  border: none;
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
