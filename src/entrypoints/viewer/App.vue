<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import CodeView from '@/components/CodeView.vue';
import ErrorView from '@/components/ErrorView.vue';
import LocalDropZone from '@/components/LocalDropZone.vue';
import ReferenceSidebar from '@/components/ReferenceSidebar.vue';
import StatusBar from '@/components/StatusBar.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useSourceFetch } from '@/composables/source/useSourceFetch';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { usePreferences } from '@/composables/usePreferences';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useViewerDragAndDrop } from '@/composables/viewer/useViewerDragAndDrop';
import { useViewerNavigationResolver } from '@/composables/viewer/useViewerNavigationResolver';
import { useViewerProjectActions } from '@/composables/viewer/useViewerProjectActions';
import { useViewerSidebarSync } from '@/composables/viewer/useViewerSidebarSync';
import { t } from '@/utils/i18n';

const {
  loading,
  errorMessage,
  errorWithNativeButton,
  fileAccessDenied,
  code,
  rawCode,
  language,
  byteSize,
  targetUrl,
  fileName,
  isLocalSnapshot,
  isDomFallback,
  isSourceTabClosed,
  isDirectoryFile,
  hasFileHandle,
  contentDisposition,
  httpStatus,
  httpStatusText,
  load,
  loadFromLocalFile,
  loadFromDirectoryFile,
  refreshSource,
  clearUrl,
} = useSourceFetch();

const localDirectory = useLocalDirectory();
const { themeId, wordWrap, codeFontSize, openIn } = usePreferences();
const sidebar = useReferenceSidebar();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');
const codeView = useTemplateRef('codeView');

const { openLocalFile, pickAndOpenLocalFile, openDirectory, onDirectoryLoaded, closeDirectory } =
  useViewerProjectActions({
    localDirectory,
    sidebar,
    clearUrl,
    load,
    loadFromLocalFile,
    loadFromDirectoryFile,
  });

const { onSidebarNavigate, onSidebarNavigateShortcut, onLinkClick } = useViewerNavigationResolver({
  localDirectory,
  sidebar,
  load,
  loadFromDirectoryFile,
});

useViewerSidebarSync({
  localDirectory,
  sidebar,
  code,
  baseUrl,
  loading,
  errorMessage,
});

useViewerDragAndDrop({
  onDropDirectory: async (dataTransfer) => {
    const loadedDir = await localDirectory.loadFromDataTransfer(dataTransfer);
    if (loadedDir) {
      onDirectoryLoaded();
      return true;
    }
    return false;
  },
  onDropFile: (file) => openLocalFile(file),
});

void load();
</script>

<template>
  <div id="app-viewer">
    <Toolbar
      v-model:theme-id="themeId"
      v-model:word-wrap="wordWrap"
      v-model:font-size="codeFontSize"
      v-model:open-in="openIn"
      :target-url="targetUrl"
      :code="code"
      :raw-code="rawCode"
      :language="language"
      :content-disposition="contentDisposition"
      :sidebar-open="sidebar.isOpen.value"
      :has-file-handle="hasFileHandle"
      :is-local-snapshot="isLocalSnapshot"
      :is-directory-file="isDirectoryFile"
      :is-directory-loaded="localDirectory.isLoaded.value"
      :file-name="fileName"
      @search="codeView?.openSearch()"
      @toggle-sidebar="sidebar.toggle()"
      @open-local="pickAndOpenLocalFile"
      @open-directory="openDirectory"
      @close-directory="closeDirectory"
      @reload="refreshSource"
    />

    <div id="main-area">
      <ReferenceSidebar
        v-if="sidebar.isOpen.value"
        :vfs-tree="sidebar.vfsTree.value"
        :active-url="sidebar.activeUrl.value"
        :directory-name="localDirectory.isLoaded.value ? localDirectory.rootName.value : null"
        @navigate="onSidebarNavigate"
        @navigate-shortcut="onSidebarNavigateShortcut"
        @toggle-folder="sidebar.toggleFolder"
        @toggle-file="sidebar.toggleFile"
        @close="sidebar.toggle()"
        @close-directory="closeDirectory"
      />

      <div id="content">
        <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
        <ErrorView
          v-else-if="fileAccessDenied"
          :url="targetUrl"
          :message="t('fileSchemePermissionHelp')"
          :file-access-denied="true"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <ErrorView
          v-else-if="errorMessage && errorWithNativeButton && targetUrl"
          :url="targetUrl"
          :message="errorMessage"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
        <LocalDropZone
          v-else-if="!code && !loading"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <CodeView
          v-else
          ref="codeView"
          :code
          :language
          :base-url
          :wrap="wordWrap"
          :theme-id
          :font-size="codeFontSize"
          @link-click="onLinkClick"
        />
      </div>
    </div>

    <StatusBar
      v-if="byteSize !== null"
      :bytes="byteSize"
      :http-status="httpStatus"
      :http-status-text="httpStatusText"
      :is-local-snapshot="isLocalSnapshot"
      :is-dom-fallback="isDomFallback"
      :is-source-tab-closed="isSourceTabClosed"
      :directory-name="localDirectory.isLoaded.value ? localDirectory.rootName.value : null"
    />
  </div>
</template>

<style>
#app-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
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
