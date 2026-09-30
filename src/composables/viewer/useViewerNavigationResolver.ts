import type { useLocalDirectory } from '@/composables/useLocalDirectory';
import type { ReferenceEntry, VfsNode, useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { classifyLinkTarget } from '@/utils/linkTarget';

export interface UseViewerNavigationResolverOptions {
  localDirectory: ReturnType<typeof useLocalDirectory>;
  sidebar: ReturnType<typeof useReferenceSidebar>;
  load: (url?: string) => Promise<void>;
  loadFromDirectoryFile: (path: string) => Promise<void>;
}

export interface UseViewerNavigationResolverReturn {
  onSidebarNavigate: (node: VfsNode) => void;
  onSidebarNavigateShortcut: (refEntry: ReferenceEntry) => void;
  onLinkClick: (payload: { rawUrl: string; targetUrl: string; event: MouseEvent }) => void;
}

/**
 * Resolves internal navigation between files in a local directory or remote VFS sidebar,
 * and intercepts cross-references clicked inside the code view.
 */
export function useViewerNavigationResolver(
  options: UseViewerNavigationResolverOptions,
): UseViewerNavigationResolverReturn {
  const { localDirectory, sidebar, load, loadFromDirectoryFile } = options;

  function revealAndLoadLocalFile(filePath: string): void {
    const activeFileUrl = `file:///${localDirectory.rootName.value}/${filePath}`;
    sidebar.activeUrl.value = activeFileUrl;
    sidebar.revealNode(activeFileUrl);
    void loadFromDirectoryFile(filePath);
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
        revealAndLoadLocalFile(dirFile.path);
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
    let resolvedTarget = clickedTargetUrl;
    try {
      const parsed = new URL(clickedTargetUrl);
      if (parsed.searchParams.has('url')) {
        resolvedTarget = parsed.searchParams.get('url') ?? clickedTargetUrl;
      }
    } catch {
      // not a valid URL
    }

    if (localDirectory.isLoaded.value) {
      const matchedFile = localDirectory.getFile(resolvedTarget) ?? localDirectory.getFile(rawUrl);
      if (matchedFile) {
        event.preventDefault();
        revealAndLoadLocalFile(matchedFile.path);
        return;
      }
    }

    // In-place navigation for font links when clicked without modifier keys
    if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      try {
        const parsed = new URL(resolvedTarget);
        if (classifyLinkTarget(parsed) === 'font') {
          event.preventDefault();
          sidebar.activeUrl.value = resolvedTarget;
          void load(resolvedTarget);
        }
      } catch {
        // not a valid URL
      }
    }
  }

  return {
    onSidebarNavigate,
    onSidebarNavigateShortcut,
    onLinkClick,
  };
}
