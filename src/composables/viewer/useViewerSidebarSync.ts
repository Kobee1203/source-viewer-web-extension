import { type Ref, onMounted, watch } from 'vue';
import type { useLocalDirectory } from '@/composables/useLocalDirectory';
import type { useReferenceSidebar } from '@/composables/useReferenceSidebar';

export interface UseViewerSidebarSyncOptions {
  localDirectory: ReturnType<typeof useLocalDirectory>;
  sidebar: ReturnType<typeof useReferenceSidebar>;
  code: Ref<string>;
  baseUrl: Ref<string>;
  loading: Ref<boolean>;
  errorMessage: Ref<string | null>;
}

/**
 * Synchronizes the reference sidebar and directory tree with the current source and query parameters.
 */
export function useViewerSidebarSync(options: UseViewerSidebarSyncOptions): void {
  const { localDirectory, sidebar, code, baseUrl, loading, errorMessage } = options;

  // Detect reload with a distinct ?root param (user had navigated away before reloading).
  const searchParams =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const rootParam = searchParams.get('root') ?? '';
  const urlParam = searchParams.get('url') ?? '';
  const hasDistinctRoot = !!rootParam && rootParam !== urlParam;

  onMounted(() => {
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
}
