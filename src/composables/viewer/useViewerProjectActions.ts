import type { useLocalDirectory } from '@/composables/useLocalDirectory';
import { pickLocalFile } from '@/composables/useLocalFile';
import type { useReferenceSidebar } from '@/composables/useReferenceSidebar';

export interface UseViewerProjectActionsOptions {
  localDirectory: ReturnType<typeof useLocalDirectory>;
  sidebar: ReturnType<typeof useReferenceSidebar>;
  clearUrl: () => void;
  load: () => Promise<void>;
  loadFromLocalFile: (file: File, handle?: FileSystemFileHandle) => Promise<void>;
  loadFromDirectoryFile: (path: string) => Promise<void>;
}

export interface UseViewerProjectActionsReturn {
  openLocalFile: (file: File, handle?: FileSystemFileHandle) => Promise<void>;
  pickAndOpenLocalFile: () => Promise<void>;
  openDirectory: () => Promise<void>;
  onDirectoryLoaded: () => void;
  closeDirectory: () => Promise<void>;
}

/**
 * Coordinates project and file workflows across local directory, reference sidebar, and source fetch.
 */
export function useViewerProjectActions(options: UseViewerProjectActionsOptions): UseViewerProjectActionsReturn {
  const { localDirectory, sidebar, clearUrl, load, loadFromLocalFile, loadFromDirectoryFile } = options;

  async function openLocalFile(file: File, handle?: FileSystemFileHandle): Promise<void> {
    if (localDirectory.isLoaded.value) {
      await localDirectory.closeDirectory();
      sidebar.reset();
    }
    clearUrl();
    await loadFromLocalFile(file, handle);
  }

  async function pickAndOpenLocalFile(): Promise<void> {
    const result = await pickLocalFile();
    if (result) {
      await openLocalFile(result.file, result.handle);
    }
  }

  function onDirectoryLoaded(): void {
    clearUrl();
    const activeFileUrl = `file:///${localDirectory.rootName.value}/${localDirectory.activePath.value}`;
    sidebar.setDirectoryTree(localDirectory.directoryVfsTree.value, activeFileUrl, true);
    void loadFromDirectoryFile(localDirectory.activePath.value);
  }

  async function openDirectory(): Promise<void> {
    const ok = await localDirectory.pickDirectory();
    if (ok) {
      onDirectoryLoaded();
    }
  }

  async function closeDirectory(): Promise<void> {
    await localDirectory.closeDirectory();
    sidebar.reset();
    sidebar.isOpen.value = false;
    clearUrl();
    void load();
  }

  return {
    openLocalFile,
    pickAndOpenLocalFile,
    openDirectory,
    onDirectoryLoaded,
    closeDirectory,
  };
}
