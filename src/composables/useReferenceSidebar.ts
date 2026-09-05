import { ref } from 'vue';
import type { ReferenceEntry } from '@/utils/extractReferences';
import { extractReferences } from '@/utils/extractReferences';
import { fontViewerUrl } from '@/utils/fontViewerUrl';

export interface ReferenceNode extends ReferenceEntry {
  /** Child references of this file; null = not yet loaded. */
  children: ReferenceNode[] | null;
  isExpanded: boolean;
  isLoading: boolean;
  /** True when this URL already appears in an ancestor — prevents infinite recursion. */
  isCircular: boolean;
  /** Set of ancestor URLs used for circular-reference detection. Not reactive on purpose. */
  ancestorUrls: ReadonlySet<string>;
}

function filenameFromUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr);
    const parts = u.pathname.split('/').filter(Boolean);
    return parts.pop() ?? urlStr;
  } catch {
    return urlStr;
  }
}

function makeNode(entry: ReferenceEntry, ancestorUrls: ReadonlySet<string>): ReferenceNode {
  return {
    ...entry,
    children: null,
    isExpanded: false,
    isLoading: false,
    isCircular: ancestorUrls.has(entry.url),
    ancestorUrls,
  };
}

function findNode(url: string, nodes: ReferenceNode[]): ReferenceNode | null {
  for (const node of nodes) {
    if (node.url === url) return node;
    if (node.children) {
      const found = findNode(url, node.children);
      if (found) return found;
    }
  }
  return null;
}

export function useReferenceSidebar() {
  const isOpen = ref(false);
  const roots = ref<ReferenceNode[]>([]);
  /** URL of the file currently displayed in the viewer. */
  const activeUrl = ref('');
  /** URL of the initial (root) file — used for the "back to root" action. */
  const rootUrl = ref('');
  /** Display name of the root file. */
  const rootFilename = ref('');
  /** URL of the node currently waiting for its children to be populated after a fetch. */
  const pendingNodeUrl = ref<string | null>(null);

  function toggle(): void {
    isOpen.value = !isOpen.value;
  }

  /**
   * Called whenever the viewer loads a new Source.
   * - On first load: initializes the root list from the source's references.
   * - On subsequent in-page navigation: populates the pending node's children.
   */
  function initFromSource(source: string, baseUrl: string): void {
    const refs = extractReferences(source, baseUrl);

    if (!rootUrl.value) {
      // First load — initialize root state
      rootUrl.value = baseUrl;
      rootFilename.value = filenameFromUrl(baseUrl);
      activeUrl.value = baseUrl;
      const rootAncestors = new Set<string>([baseUrl]);
      roots.value = refs.map((r) => makeNode(r, rootAncestors));
      return;
    }

    // Subsequent in-page navigation — populate the pending node's children
    const targetUrl = pendingNodeUrl.value;
    if (targetUrl === null) return; // navigated to an already-loaded node, nothing to do

    const node = findNode(targetUrl, roots.value);
    if (node?.isLoading) {
      const childAncestors = new Set([...node.ancestorUrls, node.url]);
      node.children = refs.map((r) => makeNode(r, childAncestors));
      node.isLoading = false;
      node.isExpanded = true;
    }
    pendingNodeUrl.value = null;
  }

  /**
   * Navigates the viewer to the given node.
   * Font files open in a new tab (they use a separate Extension Page — the Font Viewer —
   * so in-page navigation is not possible without losing the sidebar state).
   * Source files navigate in-page so the sidebar tree is preserved.
   */
  function navigateTo(node: ReferenceNode, loadFn: (url: string) => Promise<void>): void {
    if (node.isCircular) return;

    if (node.linkTarget === 'font') {
      window.open(fontViewerUrl(node.url), '_blank', 'noopener,noreferrer');
      return;
    }

    activeUrl.value = node.url;

    if (node.children === null) {
      node.isLoading = true;
      pendingNodeUrl.value = node.url;
    }

    void loadFn(node.url);
  }

  /** Navigates the viewer back to the initial root file. */
  function navigateToRoot(loadFn: (url: string) => Promise<void>): void {
    if (!rootUrl.value || activeUrl.value === rootUrl.value) return;
    activeUrl.value = rootUrl.value;
    void loadFn(rootUrl.value);
  }

  /** Toggle expand/collapse of a node whose children have already been loaded. */
  function toggleExpand(node: ReferenceNode): void {
    if (node.children !== null || node.isLoading) {
      node.isExpanded = !node.isExpanded;
    }
  }

  /**
   * Clears the loading state when a fetch fails, so the node doesn't spin indefinitely.
   * Sets children to an empty array to signal "loaded but empty".
   */
  function handleLoadError(): void {
    const targetUrl = pendingNodeUrl.value;
    if (targetUrl === null) return;
    const node = findNode(targetUrl, roots.value);
    if (node) {
      node.isLoading = false;
      node.children = [];
    }
    pendingNodeUrl.value = null;
  }

  /** Resets all sidebar state — call when performing a top-level navigation. */
  function reset(): void {
    roots.value = [];
    activeUrl.value = '';
    rootUrl.value = '';
    rootFilename.value = '';
    pendingNodeUrl.value = null;
  }

  return {
    isOpen,
    roots,
    activeUrl,
    rootUrl,
    rootFilename,
    toggle,
    initFromSource,
    navigateTo,
    navigateToRoot,
    toggleExpand,
    handleLoadError,
    reset,
  };
}
