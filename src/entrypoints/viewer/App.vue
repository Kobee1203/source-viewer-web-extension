<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import CodeView from '@/components/CodeView.vue';
import ErrorView from '@/components/ErrorView.vue';
import LocalDropZone from '@/components/LocalDropZone.vue';
import ReferenceSidebar from '@/components/ReferenceSidebar.vue';
import StatusBar from '@/components/StatusBar.vue';
import Toolbar from '@/components/Toolbar.vue';
import { useSourceFetch } from '@/composables/source/useSourceFetch';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { pickLocalFile } from '@/composables/useLocalFile';
import { usePreferences } from '@/composables/usePreferences';
import { type ReferenceEntry, type VfsNode, useReferenceSidebar } from '@/composables/useReferenceSidebar';
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
const isGlobalDragging = ref(false);

// Detect reload with a distinct ?root param (user had navigated away before reloading).
const searchParams = new URLSearchParams(window.location.search);
const rootParam = searchParams.get('root') ?? '';
const urlParam = searchParams.get('url') ?? '';
const hasDistinctRoot = !!rootParam && rootParam !== urlParam;

async function onOpenLocal(): Promise<void> {
  const result = await pickLocalFile();
  if (result) {
    if (localDirectory.isLoaded.value) {
      await localDirectory.closeDirectory();
      sidebar.reset();
    }
    clearUrl();
    await loadFromLocalFile(result.file, result.handle);
  }
}

function onFileSelected(file: File, handle?: FileSystemFileHandle): void {
  if (localDirectory.isLoaded.value) {
    void localDirectory.closeDirectory();
    sidebar.reset();
  }
  clearUrl();
  void loadFromLocalFile(file, handle);
}

async function onOpenDirectory(): Promise<void> {
  const ok = await localDirectory.pickDirectory();
  if (ok) {
    onDirectoryLoaded();
  }
}

function onDirectoryLoaded(): void {
  clearUrl();
  const activeFileUrl = `file:///${localDirectory.rootName.value}/${localDirectory.activePath.value}`;
  sidebar.setDirectoryTree(localDirectory.directoryVfsTree.value, activeFileUrl, true);
  void loadFromDirectoryFile(localDirectory.activePath.value);
}

async function onCloseDirectory(): Promise<void> {
  await localDirectory.closeDirectory();
  sidebar.reset();
  sidebar.isOpen.value = false;
  clearUrl();
  void load();
}

function onSidebarNavigate(node: VfsNode): void {
  if (localDirectory.isLoaded.value && node.url) {
    const dirFile = localDirectory.getFile(node.url);
    if (dirFile) {
      sidebar.activeUrl.value = node.url;
      void loadFromDirectoryFile(dirFile.path);
      return;
    }
  }
  sidebar.navigateTo(node, load);
}

function onSidebarNavigateShortcut(refEntry: ReferenceEntry): void {
  if (localDirectory.isLoaded.value && refEntry.url) {
    const dirFile = localDirectory.getFile(refEntry.url);
    if (dirFile) {
      const activeFileUrl = `file:///${localDirectory.rootName.value}/${dirFile.path}`;
      sidebar.activeUrl.value = activeFileUrl;
      sidebar.revealNode(activeFileUrl);
      void loadFromDirectoryFile(dirFile.path);
      return;
    }
  }
  sidebar.navigateToShortcut(refEntry, load);
}

function onLinkClick({
  rawUrl,
  targetUrl: clickedTargetUrl,
  event,
}: {
  rawUrl: string;
  targetUrl: string;
  event: MouseEvent;
}): void {
  if (localDirectory.isLoaded.value) {
    let resolvedTarget = clickedTargetUrl;
    try {
      const parsed = new URL(clickedTargetUrl);
      if (parsed.searchParams.has('url')) {
        resolvedTarget = parsed.searchParams.get('url') ?? clickedTargetUrl;
      }
    } catch {
      // not a valid URL
    }

    const matchedFile = localDirectory.getFile(resolvedTarget) ?? localDirectory.getFile(rawUrl);
    if (matchedFile) {
      event.preventDefault();
      const activeFileUrl = `file:///${localDirectory.rootName.value}/${matchedFile.path}`;
      sidebar.activeUrl.value = activeFileUrl;
      sidebar.revealNode(activeFileUrl);
      void loadFromDirectoryFile(matchedFile.path);
    }
  }
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

async function onWindowDrop(event: DragEvent): Promise<void> {
  event.preventDefault();
  isGlobalDragging.value = false;
  if (!event.dataTransfer) return;

  const loadedDir = await localDirectory.loadFromDataTransfer(event.dataTransfer);
  if (loadedDir) {
    onDirectoryLoaded();
    return;
  }

  const file = event.dataTransfer.files?.[0];
  if (file) {
    if (localDirectory.isLoaded.value) {
      await localDirectory.closeDirectory();
      sidebar.reset();
    }
    clearUrl();
    void loadFromLocalFile(file);
  }
}

function handleWindowDrop(event: DragEvent): void {
  void onWindowDrop(event);
}

onMounted(() => {
  window.addEventListener('dragover', onWindowDragOver);
  window.addEventListener('dragleave', onWindowDragLeave);
  window.addEventListener('drop', handleWindowDrop);

  // If page was loaded without a url param, check if there's a stored directory project
  if (!urlParam) {
    void (async () => {
      const restored = await localDirectory.restoreFromStorage();
      if (restored) {
        const activeFileUrl = `file:///${localDirectory.rootName.value}/${localDirectory.activePath.value}`;
        sidebar.setDirectoryTree(localDirectory.directoryVfsTree.value, activeFileUrl, true);
      }
    })();
  }

  if (hasDistinctRoot) {
    void sidebar.seedFromRootUrl(rootParam);
  }
});

onUnmounted(() => {
  window.removeEventListener('dragover', onWindowDragOver);
  window.removeEventListener('dragleave', onWindowDragLeave);
  window.removeEventListener('drop', handleWindowDrop);
});

// When the source finishes loading and the sidebar is open: insert its refs into the VFS.
watch([code, baseUrl], ([newCode, newBase]) => {
  if (!sidebar.isOpen.value || !newCode || !newBase) return;
  if (localDirectory.isLoaded.value) {
    sidebar.activeUrl.value = newBase;
    sidebar.initFromSource(newCode, newBase, false);
    return;
  }
  sidebar.initFromSource(newCode, newBase, hasDistinctRoot);
});

// When the sidebar is opened and has not yet been populated from the current source: do it now.
watch(sidebar.isOpen, (open) => {
  if (!open || !code.value || !baseUrl.value) return;
  if (localDirectory.isLoaded.value) return;
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
      :is-local-snapshot="isLocalSnapshot"
      :is-directory-file="isDirectoryFile"
      :is-directory-loaded="localDirectory.isLoaded.value"
      :file-name="fileName"
      @search="codeView?.openSearch()"
      @toggle-sidebar="sidebar.toggle()"
      @open-local="onOpenLocal"
      @open-directory="onOpenDirectory"
      @close-directory="onCloseDirectory"
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
        @close-directory="onCloseDirectory"
      />

      <div id="content">
        <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
        <ErrorView
          v-else-if="fileAccessDenied"
          :url="targetUrl"
          :message="t('fileSchemePermissionHelp')"
          :file-access-denied="true"
          @file-selected="onFileSelected"
          @directory-loaded="onDirectoryLoaded"
        />
        <ErrorView
          v-else-if="errorMessage && errorWithNativeButton && targetUrl"
          :url="targetUrl"
          :message="errorMessage"
          @file-selected="onFileSelected"
          @directory-loaded="onDirectoryLoaded"
        />
        <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
        <LocalDropZone
          v-else-if="!code && !loading"
          @file-selected="onFileSelected"
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
