<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import CodeView from '@/components/CodeView.vue';
import ErrorView from '@/components/ErrorView.vue';
import LocalDropZone from '@/components/LocalDropZone.vue';
import ReferenceSidebar from '@/components/ReferenceSidebar.vue';
import StatusBar from '@/components/StatusBar.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useSourceFetch } from '@/composables/source/useSourceFetch';
import { pickLocalFile } from '@/composables/useLocalFile';
import { usePreferences } from '@/composables/usePreferences';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
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
  hasFileHandle,
  contentDisposition,
  httpStatus,
  httpStatusText,
  load,
  loadFromLocalFile,
  reloadLocalFile,
} = useSourceFetch();

const { themeId, wordWrap, codeFontSize, openIn } = usePreferences();

const sidebar = useReferenceSidebar();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');

const codeView = useTemplateRef('codeView');

const isGlobalDragging = ref(false);

// Detect reload with a distinct ?root param (user had navigated away before reloading).
const searchParams = new URLSearchParams(window.location.search);
const rootParam = searchParams.get('root') ?? '';
const urlParam = searchParams.get('url') ?? '';
const hasDistinctRoot = !!rootParam && rootParam !== urlParam;

async function onOpenLocal(): Promise<void> {
  const result = await pickLocalFile();
  if (result) {
    await loadFromLocalFile(result.file, result.handle);
  }
}

async function onReloadLocal(): Promise<void> {
  await reloadLocalFile();
}

function onFileSelected(file: File, handle?: FileSystemFileHandle): void {
  void loadFromLocalFile(file, handle);
}

// Global drag and drop support across the entire viewer window
function onWindowDragOver(event: DragEvent): void {
  event.preventDefault();
  isGlobalDragging.value = true;
}

function onWindowDragLeave(event: DragEvent): void {
  if (event.relatedTarget === null) {
    isGlobalDragging.value = false;
  }
}

function onWindowDrop(event: DragEvent): void {
  event.preventDefault();
  isGlobalDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    void loadFromLocalFile(file);
  }
}

onMounted(() => {
  window.addEventListener('dragover', onWindowDragOver);
  window.addEventListener('dragleave', onWindowDragLeave);
  window.addEventListener('drop', onWindowDrop);

  // Pre-seed the sidebar from the initial root source when the page was reloaded
  // while the viewer was showing a child file. This fires immediately so the VFS tree
  // is populated by the time the user opens the sidebar.
  if (hasDistinctRoot) {
    void sidebar.seedFromRootUrl(rootParam);
  }
});

onUnmounted(() => {
  window.removeEventListener('dragover', onWindowDragOver);
  window.removeEventListener('dragleave', onWindowDragLeave);
  window.removeEventListener('drop', onWindowDrop);
});

// When the source finishes loading and the sidebar is open: insert its refs into the VFS.
watch([code, baseUrl], ([newCode, newBase]) => {
  if (!sidebar.isOpen.value || !newCode || !newBase) return;
  sidebar.initFromSource(newCode, newBase, hasDistinctRoot);
});

// When the sidebar is opened and has not yet been populated from the current source: do it now.
watch(sidebar.isOpen, (open) => {
  if (!open || !code.value || !baseUrl.value) return;
  if (!sidebar.rootUrl.value) {
    sidebar.initFromSource(code.value, baseUrl.value, hasDistinctRoot);
  }
});

// Clear the sidebar loading spinner when a fetch fails so the node doesn't spin forever.
watch(loading, (isLoading) => {
  if (!isLoading && errorMessage.value) {
    sidebar.handleLoadError();
  }
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
      :file-name="fileName"
      @search="codeView?.openSearch()"
      @toggle-sidebar="sidebar.toggle()"
      @open-local="onOpenLocal"
      @reload-local="onReloadLocal"
    />

    <div id="main-area">
      <ReferenceSidebar
        v-if="sidebar.isOpen.value"
        :vfs-tree="sidebar.vfsTree.value"
        :active-url="sidebar.activeUrl.value"
        @navigate="(node) => sidebar.navigateTo(node, load)"
        @navigate-shortcut="(ref) => sidebar.navigateToShortcut(ref, load)"
        @toggle-folder="sidebar.toggleFolder"
        @toggle-file="sidebar.toggleFile"
        @close="sidebar.toggle()"
      />

      <div id="content">
        <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
        <ErrorView
          v-else-if="fileAccessDenied"
          :url="targetUrl"
          :message="t('fileSchemePermissionHelp')"
          :file-access-denied="true"
          @file-selected="onFileSelected"
        />
        <ErrorView
          v-else-if="errorMessage && errorWithNativeButton && targetUrl"
          :url="targetUrl"
          :message="errorMessage"
          @file-selected="onFileSelected"
        />
        <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
        <LocalDropZone v-else-if="!code && !loading" @file-selected="onFileSelected" />
        <CodeView
          v-else
          ref="codeView"
          :code
          :language
          :base-url
          :wrap="wordWrap"
          :theme-id
          :font-size="codeFontSize"
        />
      </div>
    </div>

    <StatusBar
      v-if="byteSize !== null"
      :bytes="byteSize"
      :http-status="httpStatus"
      :http-status-text="httpStatusText"
      :is-local-snapshot="isLocalSnapshot"
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
