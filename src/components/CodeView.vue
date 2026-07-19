<script setup lang="ts">
import { computed, onWatcherCleanup, shallowRef, watch } from 'vue';
import type { Extension } from '@codemirror/state';
import CodeMirror from 'vue-codemirror6';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { xml } from '@codemirror/lang-xml';

import { DEFAULT_FILE_TYPE, FileType } from '@/utils/fileType';
import { linkifyPlugin } from '@/utils/cm-linkify';
import { DEFAULT_THEME_ID, getThemeExtension } from '@/utils/themes';

const props = defineProps<{
  code: string;
  language: FileType;
  baseUrl: string;
  wrap: boolean;
  themeId?: string;
}>();

const lang = computed(() => {
  switch (props.language) {
    case DEFAULT_FILE_TYPE:
      return html();
    case 'javascript':
      return javascript();
    case 'css':
      return css();
    case 'json':
      return json();
    case 'xml':
      return xml();
    default:
      return html();
  }
});

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

const extensions = computed(() => [themeExtension.value, linkifyPlugin(props.baseUrl)]);
</script>

<template>
  <div class="code-view">
    <CodeMirror :model-value="code" basic readonly disabled :wrap :lang :extensions />
  </div>
</template>

<style>
.code-view {
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
  text-decoration: none;
}
</style>
