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

const sourceFetch = useSourceFetch();
const localDirectory = useLocalDirectory();
const sidebar = useReferenceSidebar();
const { themeId, wordWrap, codeFontSize, openIn } = usePreferences();

const baseUrl = computed(() => sourceFetch.targetUrl.value?.toString() ?? '');
const codeView = useTemplateRef('codeView');

const { openLocalFile, pickAndOpenLocalFile, openDirectory, onDirectoryLoaded, closeDirectory } =
  useViewerProjectActions({
    localDirectory,
    sidebar,
    clearUrl: sourceFetch.clearUrl,
    load: sourceFetch.load,
    loadFromLocalFile: sourceFetch.loadFromLocalFile,
    loadFromDirectoryFile: sourceFetch.loadFromDirectoryFile,
  });

const { onSidebarNavigate, onSidebarNavigateShortcut, onLinkClick } = useViewerNavigationResolver({
  localDirectory,
  sidebar,
  load: sourceFetch.load,
  loadFromDirectoryFile: sourceFetch.loadFromDirectoryFile,
});

useViewerSidebarSync({
  localDirectory,
  sidebar,
  code: sourceFetch.code,
  baseUrl,
  loading: sourceFetch.loading,
  errorMessage: sourceFetch.errorMessage,
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

void sourceFetch.load();
</script>

<template>
  <div id="app-viewer">
    <Toolbar
      v-model:theme-id="themeId"
      v-model:word-wrap="wordWrap"
      v-model:font-size="codeFontSize"
      v-model:open-in="openIn"
      :source="sourceFetch"
      :sidebar-open="sidebar.isOpen.value"
      :is-directory-loaded="localDirectory.isLoaded.value"
      @search="codeView?.openSearch()"
      @toggle-sidebar="sidebar.toggle()"
      @open-local="pickAndOpenLocalFile"
      @open-directory="openDirectory"
      @close-directory="closeDirectory"
      @reload="sourceFetch.refreshSource"
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
        <div v-if="sourceFetch.loading.value" class="loader">{{ t('viewerLoading') }}</div>
        <ErrorView
          v-else-if="sourceFetch.fileAccessDenied.value"
          :url="sourceFetch.targetUrl.value"
          :message="t('fileSchemePermissionHelp')"
          :file-access-denied="true"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <ErrorView
          v-else-if="
            sourceFetch.errorMessage.value && sourceFetch.errorWithNativeButton.value && sourceFetch.targetUrl.value
          "
          :url="sourceFetch.targetUrl.value"
          :message="sourceFetch.errorMessage.value"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <div v-else-if="sourceFetch.errorMessage.value" class="loader">
          {{ sourceFetch.errorMessage.value }}
        </div>
        <LocalDropZone
          v-else-if="!sourceFetch.code.value && !sourceFetch.loading.value"
          @file-selected="openLocalFile"
          @directory-loaded="onDirectoryLoaded"
        />
        <CodeView
          v-else
          ref="codeView"
          :code="sourceFetch.code.value"
          :language="sourceFetch.language.value"
          :base-url
          :wrap="wordWrap"
          :theme-id
          :font-size="codeFontSize"
          @link-click="onLinkClick"
        />
      </div>
    </div>

    <StatusBar
      v-if="sourceFetch.byteSize.value !== null"
      :source="sourceFetch"
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
