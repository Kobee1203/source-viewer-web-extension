import { ref } from 'vue';
import type { VfsFileNode, VfsFolderNode, VfsNode } from '@/utils/buildVfsTree';
import { insertIntoVfs } from '@/utils/buildVfsTree';
import { mimeToFileType } from '@/utils/contentType';
import { extractReferences } from '@/utils/extractReferences';
import { getFileType } from '@/utils/fileType';
import { fontViewerUrl } from '@/utils/fontViewerUrl';
import { requestSource } from '@/utils/messaging';

export type { VfsFileNode, VfsFolderNode, VfsNode } from '@/utils/buildVfsTree';

// ---------------------------------------------------------------------------
// Tree helpers
// ---------------------------------------------------------------------------

function findFileNode(url: string, nodes: VfsNode[]): VfsFileNode | null {
  for (const node of nodes) {
    if (node.kind === 'file' && node.url === url) return node;
    if (node.kind === 'folder') {
      const found = findFileNode(url, node.children);
      if (found) return found;
    }
  }
  return null;
}

function hostnameOf(urlStr: string): string {
  try {
    return new URL(urlStr).hostname;
  } catch {
    return urlStr;
  }
}

function filenameOf(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.pop() ?? u.hostname;
  } catch {
    return urlStr;
  }
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useReferenceSidebar() {
  const isOpen = ref(false);
  /** The virtual file-system tree — mutated in place so Vue's Proxy tracks changes. */
  const vfsTree = ref<VfsNode[]>([]);
  /** URL of the file currently displayed in the viewer. */
  const activeUrl = ref('');
  /** Hostname of the initial (root) file — used to classify internal vs external refs. */
  const rootHostname = ref('');
  /** URL of the initial (root) file — used for the "back to root" breadcrumb. */
  const rootUrl = ref('');
  /** Display name of the root file. */
  const rootFilename = ref('');
  /**
   * The file node that is waiting for its references to be loaded.
   * Set in `navigateTo`; cleared in `initFromSource` once the fetch completes.
   */
  const pendingFileUrl = ref<string | null>(null);

  // ── Private helpers ───────────────────────────────────────────────────────

  function setRootInfo(urlStr: string): void {
    if (rootUrl.value) return; // already initialised — do not overwrite
    rootUrl.value = urlStr;
    rootFilename.value = filenameOf(urlStr);
    rootHostname.value = hostnameOf(urlStr);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /**
   * Inserts references extracted from a loaded source into the global VFS tree.
   * Called by App.vue whenever the viewer finishes loading a new source.
   *
   * @param source    Formatted source text (as displayed in the viewer).
   * @param baseUrl   Absolute URL of the loaded source.
   * @param markCurrentAsExplored
   *   Set to `true` when called after a page reload with `?root≠url` so that the
   *   current file node (already in the tree from the root seeding) is marked as
   *   explored without going through the normal `pendingFileUrl` flow.
   */
  function initFromSource(source: string, baseUrl: string, markCurrentAsExplored = false): void {
    setRootInfo(baseUrl);
    activeUrl.value = baseUrl;

    const refs = extractReferences(source, baseUrl);
    for (const ref of refs) {
      insertIntoVfs(vfsTree.value, ref, rootHostname.value, rootUrl.value);
    }

    // Update whichever file node was waiting for its references.
    const pendingUrl = pendingFileUrl.value;
    if (pendingUrl !== null) {
      const node = findFileNode(pendingUrl, vfsTree.value);
      if (node) {
        node.isLoading = false;
        node.isExplored = true;
        node.hasReferences = refs.length > 0;
      }
      pendingFileUrl.value = null;
    } else if (markCurrentAsExplored) {
      // Reload case: the current file was already in the tree from root seeding.
      const node = findFileNode(baseUrl, vfsTree.value);
      if (node) {
        node.isExplored = true;
        node.hasReferences = refs.length > 0;
      }
    }
  }

  /**
   * Fetches the root source independently and seeds the VFS tree from it.
   * Used on page reload when `?root` differs from `?url`: the viewer shows the
   * last-visited file, but the sidebar should be rooted at the initial source.
   */
  async function seedFromRootUrl(urlStr: string): Promise<void> {
    setRootInfo(urlStr);
    try {
      const response = await requestSource(urlStr);
      if (!response.ok) return;
      const target = new URL(urlStr);
      const fileType = mimeToFileType(response.contentType) ?? getFileType(target);
      // Extract refs from raw text — no need to beautify for reference scanning.
      const { formatSource } = await import('@/utils/beautify');
      const formatted = formatSource(response.text, fileType);
      const refs = extractReferences(formatted, urlStr);
      for (const ref of refs) {
        insertIntoVfs(vfsTree.value, ref, rootHostname.value, rootUrl.value);
      }
    } catch {
      // Silent fail: the sidebar will simply not have the initial root's references.
    }
  }

  /**
   * Navigate the viewer to a VFS node (file or clickable folder).
   * - Font files open in a new tab (Font Viewer is a separate Extension Page).
   * - Source files navigate in-page to preserve sidebar state.
   */
  function navigateTo(node: VfsNode, loadFn: (url: string) => Promise<void>): void {
    const url = node.url;
    if (!url) return;

    if (
      (node.kind === 'file' && node.linkTarget === 'font') ||
      (node.kind === 'folder' && node.linkTarget === 'font')
    ) {
      window.open(fontViewerUrl(url), '_blank', 'noopener,noreferrer');
      return;
    }

    activeUrl.value = url;

    if (node.kind === 'file' && !node.isExplored) {
      node.isLoading = true;
      pendingFileUrl.value = url;
    }

    void loadFn(url);
  }

  /** Navigate the viewer back to the initial root file. */
  function navigateToRoot(loadFn: (url: string) => Promise<void>): void {
    if (!rootUrl.value || activeUrl.value === rootUrl.value) return;
    activeUrl.value = rootUrl.value;
    void loadFn(rootUrl.value);
  }

  /** Toggle the expand/collapse state of a folder node. */
  function toggleFolder(node: VfsFolderNode): void {
    node.isExpanded = !node.isExpanded;
  }

  /**
   * Clears the loading state when a fetch fails, preventing the node from
   * spinning indefinitely.
   */
  function handleLoadError(): void {
    if (pendingFileUrl.value === null) return;
    const node = findFileNode(pendingFileUrl.value, vfsTree.value);
    if (node) {
      node.isLoading = false;
      node.isExplored = true;
      node.hasReferences = false;
    }
    pendingFileUrl.value = null;
  }

  /** Resets all state (e.g. when opening a completely new top-level URL). */
  function reset(): void {
    vfsTree.value = [];
    activeUrl.value = '';
    rootUrl.value = '';
    rootHostname.value = '';
    rootFilename.value = '';
    pendingFileUrl.value = null;
  }

  return {
    isOpen,
    vfsTree,
    activeUrl,
    rootUrl,
    rootFilename,
    toggle,
    initFromSource,
    seedFromRootUrl,
    navigateTo,
    navigateToRoot,
    toggleFolder,
    handleLoadError,
    reset,
  };
}
