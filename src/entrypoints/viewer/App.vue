<script setup lang="ts">
import { computed, onMounted, useTemplateRef, watch } from 'vue';
import CodeView from '@/components/CodeView.vue';
import ErrorView from '@/components/ErrorView.vue';
import ReferenceSidebar from '@/components/ReferenceSidebar.vue';
import StatusBar from '@/components/StatusBar.vue';
import Toolbar from '@/components/Toolbar.vue';
import { usePreferences } from '@/composables/usePreferences';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useSourceFetch } from '@/composables/useSourceFetch';
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

const { themeId, wordWrap, codeFontSize } = usePreferences();

const sidebar = useReferenceSidebar();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');
const themeType = computed(() => getThemeType(themeId.value));

const codeView = useTemplateRef('codeView');
const appRoot = useTemplateRef('appRoot');

onMounted(() => appRoot.value?.focus());

// Populate the sidebar whenever a new source finishes loading (guards: sidebar open, code non-empty).
watch([code, baseUrl], ([newCode, newBase]) => {
  if (!sidebar.isOpen.value || !newCode || !newBase) return;
  sidebar.initFromSource(newCode, newBase);
});

// When the sidebar is opened after the source is already loaded, populate it immediately.
watch(sidebar.isOpen, (open) => {
  if (open && !sidebar.rootUrl.value && code.value && baseUrl.value) {
    sidebar.initFromSource(code.value, baseUrl.value);
  }
});

// Clear the sidebar's loading spinner if the fetch fails so it doesn't spin indefinitely.
watch(loading, (isLoading) => {
  if (!isLoading && errorMessage.value) {
    sidebar.handleLoadError();
  }
});

void load();
</script>

<template>
  <div id="app-viewer" ref="appRoot" tabindex="-1" :data-theme-type="themeType">
    <Toolbar
      v-model:theme-id="themeId"
      v-model:word-wrap="wordWrap"
      v-model:font-size="codeFontSize"
      :target-url="targetUrl"
      :code="code"
      :language="language"
      :content-disposition="contentDisposition"
      :sidebar-open="sidebar.isOpen.value"
      @search="codeView?.openSearch()"
      @toggle-sidebar="sidebar.toggle()"
    />

    <div id="main-area">
      <ReferenceSidebar
        v-if="sidebar.isOpen.value"
        :roots="sidebar.roots.value"
        :active-url="sidebar.activeUrl.value"
        :root-url="sidebar.rootUrl.value"
        :root-filename="sidebar.rootFilename.value"
        @navigate="(node) => sidebar.navigateTo(node, load)"
        @navigate-root="sidebar.navigateToRoot(load)"
        @toggle-expand="sidebar.toggleExpand"
        @close="sidebar.toggle()"
      />

      <div id="content">
        <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
        <ErrorView
          v-else-if="errorMessage && errorWithNativeButton && targetUrl"
          :url="targetUrl"
          :message="errorMessage"
        />
        <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
        <CodeView
          v-else
          ref="codeView"
          :code
          :language
          :base-url
          :wrap="wordWrap"
          :theme-id
          :theme-type
          :font-size="codeFontSize"
        />
      </div>
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
  --dialog-bg: #fff;
  --dialog-bg-alt: #f0f0f0;
  --dialog-border: #ccc;
  --dialog-link: #00e;
  --dialog-backdrop: rgb(0 0 0 / 20%);
}

#app-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
  outline: none; /* focused on load only to capture keyboard — no focus ring wanted */
}

#main-area {
  display: flex;
  flex: 1;
  flex-direction: row;
  min-height: 0;
}

#content {
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: inherit;
}

.loader {
  padding: 20px;
  font-style: italic;
}
</style>
