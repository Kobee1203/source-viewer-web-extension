<script setup lang="ts">
import { computed, onMounted, useTemplateRef } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import CodeView from '@/components/CodeView.vue';
import StatusBar from '@/components/StatusBar.vue';
import ErrorView from '@/components/ErrorView.vue';
import { useSourceFetch } from '@/composables/useSourceFetch';
import { usePreferences } from '@/composables/usePreferences';
import { t } from '@/utils/i18n';
import { getThemeType } from '@/utils/themes';

const {
  loading,
  errorMessage,
  errorWithNativeButton,
  code,
  language,
  byteSize,
  targetUrl,
  contentDisposition,
  httpStatus,
  httpStatusText,
  load,
} = useSourceFetch();

const { themeId, wordWrap } = usePreferences();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');

const themeType = computed(() => getThemeType(themeId.value));

const codeView = useTemplateRef('codeView');
const appRoot = useTemplateRef('appRoot');

// Take keyboard focus on load so the Cmd/Ctrl-F interceptor (in CodeView) works without the user
// first clicking — notably in the in-place iframe, which otherwise stays unfocused and lets the
// browser's native find open instead.
onMounted(() => appRoot.value?.focus());

void load();
</script>

<template>
  <div id="app-viewer" ref="appRoot" tabindex="-1" :data-theme-type="themeType">
    <Toolbar
      v-model:theme-id="themeId"
      v-model:word-wrap="wordWrap"
      :target-url="targetUrl"
      :code="code"
      :language="language"
      :content-disposition="contentDisposition"
      @search="codeView?.openSearch()"
    />

    <div id="content">
      <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
      <ErrorView
        v-else-if="errorMessage && errorWithNativeButton && targetUrl"
        :url="targetUrl"
        :message="errorMessage"
      />
      <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
      <CodeView v-else ref="codeView" :code :language :base-url :wrap="wordWrap" :theme-id :theme-type />
    </div>

    <StatusBar
      v-if="byteSize !== null"
      :bytes="byteSize"
      :http-status="httpStatus"
      :http-status-text="httpStatusText"
    />
  </div>
</template>

<style>
#app-viewer[data-theme-type='light'] {
  --app-bg: #f5f2f0;
  --app-fg: #000;
  --toolbar-bg: #ddd;
  --toolbar-border: #ccc;
  --select-bg: #fff;
  --select-fg: #000;
  --select-border: #aaa;
  --statusbar-bg: #ddd;
  --statusbar-border: #ccc;
  --btn-bg: #fff;
  --btn-bg-hover: #eee;
  --btn-border: #aaa;
  --btn-active-bg: #cfe6ff;
  --btn-active-border: #7fb6ff;
  --btn-active-fg: #003a6b;
}

#app-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
  outline: none; /* focused on load only to capture keyboard — no focus ring wanted */
}

#content {
  flex: 1;

  /* min-height: 0 lets this flex child shrink to the available height instead of growing with its
     content, so CodeMirror's scroller gets a correct viewport height and can scroll matches (even
     far off-screen ones) precisely into view. */
  min-height: 0;
  overflow: auto;
  background: inherit;
}

.loader {
  padding: 20px;
  font-style: italic;
}
</style>
