import { ref, shallowRef } from 'vue';
import { type VfsNode, buildDirectoryVfsTree } from '@/utils/buildVfsTree';
import {
  type StoredDirectoryFile,
  clearStoredDirectoryProject,
  getStoredDirectoryProject,
  saveDirectoryProject,
  updateActiveDirectoryPath,
} from '@/utils/directoryStore';
import { extensionToFileType } from '@/utils/fileType';
import { classifyLinkTarget } from '@/utils/linkTarget';

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      id?: string;
      mode?: 'read' | 'readwrite';
      startIn?: string;
    }) => Promise<FileSystemDirectoryHandle>;
  }
}

const IGNORED_NAMES = new Set(['.git', 'node_modules', '.DS_Store', '.idea', '.vscode', 'Thumbs.db']);

function shouldIgnore(name: string): boolean {
  return IGNORED_NAMES.has(name) || name.startsWith('._');
}

/**
 * Shared singleton reactive state for the loaded local directory project.
 */
const isLoaded = ref(false);
const rootName = ref('');
const activePath = ref('');
const filesMap = shallowRef<Map<string, StoredDirectoryFile>>(new Map());
const directoryVfsTree = ref<VfsNode[]>([]);

/**
 * Recursively scans files from a modern FileSystemDirectoryHandle (Chromium).
 */
async function scanDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  currentPath = '',
): Promise<StoredDirectoryFile[]> {
  const results: StoredDirectoryFile[] = [];

  for await (const entry of dirHandle.values()) {
    if (shouldIgnore(entry.name)) continue;

    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      try {
        const fileHandle = entry as FileSystemFileHandle;
        const file = await fileHandle.getFile();
        const dummyUrl = new URL('file:///' + entryPath);
        const linkTarget = classifyLinkTarget(dummyUrl);
        const fileType = extensionToFileType(dummyUrl) ?? '';

        let text: string | undefined;
        let isBinary = false;

        if (linkTarget === 'font') {
          isBinary = true;
        } else {
          try {
            text = await file.text();
          } catch {
            isBinary = true;
          }
        }

        results.push({
          path: entryPath,
          name: entry.name,
          type: fileType,
          size: file.size,
          text,
          isBinary,
        });
      } catch (err) {
        console.warn(`Failed to read file ${entryPath}:`, err);
      }
    } else if (entry.kind === 'directory') {
      const sub = await scanDirectoryHandle(entry as FileSystemDirectoryHandle, entryPath);
      results.push(...sub);
    }
  }

  return results;
}

/**
 * Recursively scans files from a FileSystemDirectoryEntry (Firefox & drag-and-drop fallback).
 */
async function scanDirectoryEntry(
  dirEntry: FileSystemDirectoryEntry,
  currentPath = '',
): Promise<StoredDirectoryFile[]> {
  const dirReader = dirEntry.createReader();
  const entries: FileSystemEntry[] = [];

  const readBatch = (): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      dirReader.readEntries(resolve, reject);
    });
  };

  let batch: FileSystemEntry[];
  do {
    batch = await readBatch();
    entries.push(...batch);
  } while (batch.length > 0);

  const results: StoredDirectoryFile[] = [];

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) continue;

    const entryPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;

    if (entry.isFile) {
      try {
        const file = await new Promise<File>((resolve, reject) => {
          (entry as FileSystemFileEntry).file(resolve, reject);
        });
        const dummyUrl = new URL('file:///' + entryPath);
        const linkTarget = classifyLinkTarget(dummyUrl);
        const fileType = extensionToFileType(dummyUrl) ?? '';

        let text: string | undefined;
        let isBinary = false;

        if (linkTarget === 'font') {
          isBinary = true;
        } else {
          try {
            text = await file.text();
          } catch {
            isBinary = true;
          }
        }

        results.push({
          path: entryPath,
          name: entry.name,
          type: fileType,
          size: file.size,
          text,
          isBinary,
        });
      } catch (err) {
        console.warn(`Failed to read entry ${entryPath}:`, err);
      }
    } else if (entry.isDirectory) {
      const sub = await scanDirectoryEntry(entry as FileSystemDirectoryEntry, entryPath);
      results.push(...sub);
    }
  }

  return results;
}

/**
 * Converts a FileList from `<input type="file" webkitdirectory>` into StoredDirectoryFiles.
 */
async function scanFileList(fileList: FileList): Promise<{ rootFolderName: string; files: StoredDirectoryFile[] }> {
  const files: StoredDirectoryFile[] = [];
  let rootFolderName = 'directory';

  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    if (!file) continue;

    const relative = file.webkitRelativePath || file.name;
    const parts = relative.split('/');

    if (parts.length > 1) {
      rootFolderName = parts[0];
    }

    if (parts.some((p) => shouldIgnore(p))) continue;

    const filePath = parts.length > 1 ? parts.slice(1).join('/') : parts[0];
    const dummyUrl = new URL('file:///' + filePath);
    const linkTarget = classifyLinkTarget(dummyUrl);
    const fileType = extensionToFileType(dummyUrl) ?? '';

    let text: string | undefined;
    let isBinary = false;

    if (linkTarget === 'font') {
      isBinary = true;
    } else {
      try {
        text = await file.text();
      } catch {
        isBinary = true;
      }
    }

    files.push({
      path: filePath,
      name: file.name,
      type: fileType,
      size: file.size,
      text,
      isBinary,
    });
  }

  return { rootFolderName, files };
}

/**
 * Chooses an entrypoint file (prefers index.html, sample.html, or first html file, or first file).
 */
function findDefaultEntryPoint(files: StoredDirectoryFile[]): string {
  const indexHtml = files.find((f) => f.path.toLowerCase() === 'index.html');
  if (indexHtml) return indexHtml.path;

  const sampleHtml = files.find((f) => f.path.toLowerCase() === 'sample.html');
  if (sampleHtml) return sampleHtml.path;

  const anyHtml = files.find((f) => f.path.toLowerCase().endsWith('.html') || f.path.toLowerCase().endsWith('.htm'));
  if (anyHtml) return anyHtml.path;

  const firstSource = files.find((f) => !f.isBinary && f.text !== undefined);
  if (firstSource) return firstSource.path;

  return files[0]?.path ?? '';
}

export function useLocalDirectory() {
  /**
   * Initializes reactive state and stores the project in IndexedDB.
   */
  async function initDirectory(name: string, files: StoredDirectoryFile[], targetPath?: string): Promise<void> {
    if (files.length === 0) return;

    const entryPath =
      targetPath && files.some((f) => f.path === targetPath) ? targetPath : findDefaultEntryPoint(files);

    const map = new Map<string, StoredDirectoryFile>();
    for (const f of files) {
      map.set(f.path, f);
    }

    rootName.value = name;
    activePath.value = entryPath;
    filesMap.value = map;
    isLoaded.value = true;

    const rootFolder = buildDirectoryVfsTree(files, name);
    directoryVfsTree.value = [rootFolder];

    try {
      await saveDirectoryProject(name, entryPath, files);
    } catch (err) {
      console.warn('Failed to save directory project to IndexedDB:', err);
    }
  }

  /**
   * Opens the native directory picker or `<input type="file" webkitdirectory>`.
   */
  async function pickDirectory(): Promise<boolean> {
    if (typeof window.showDirectoryPicker === 'function') {
      try {
        const handle = await window.showDirectoryPicker();
        const scanned = await scanDirectoryHandle(handle);
        if (scanned.length > 0) {
          await initDirectory(handle.name, scanned);
          return true;
        }
        return false;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return false;
        console.warn('showDirectoryPicker failed, trying input fallback:', err);
      }
    }

    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.webkitdirectory = true;
      input.style.display = 'none';

      input.onchange = async () => {
        if (input.files && input.files.length > 0) {
          const { rootFolderName, files } = await scanFileList(input.files);
          input.remove();
          if (files.length > 0) {
            await initDirectory(rootFolderName, files);
            resolve(true);
            return;
          }
        }
        input.remove();
        resolve(false);
      };

      input.oncancel = () => {
        input.remove();
        resolve(false);
      };

      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Detects and loads a directory from a DragEvent DataTransfer.
   */
  async function loadFromDataTransfer(dataTransfer: DataTransfer): Promise<boolean> {
    const items = dataTransfer.items;
    if (!items || items.length === 0) return false;

    // 1. Try modern getAsFileSystemHandle (Chromium)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if ('getAsFileSystemHandle' in item && typeof item.getAsFileSystemHandle === 'function') {
        try {
          const handle = await item.getAsFileSystemHandle();
          if (handle && handle.kind === 'directory') {
            const scanned = await scanDirectoryHandle(handle as FileSystemDirectoryHandle);
            if (scanned.length > 0) {
              await initDirectory(handle.name, scanned);
              return true;
            }
          }
        } catch (err) {
          console.warn('getAsFileSystemHandle directory scan failed:', err);
        }
      }
    }

    // 2. Try webkitGetAsEntry (Firefox, Safari, Chromium fallback)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if ('webkitGetAsEntry' in item && typeof item.webkitGetAsEntry === 'function') {
        try {
          const entry = item.webkitGetAsEntry();
          if (entry && entry.isDirectory) {
            const scanned = await scanDirectoryEntry(entry as FileSystemDirectoryEntry);
            if (scanned.length > 0) {
              await initDirectory(entry.name, scanned);
              return true;
            }
          }
        } catch (err) {
          console.warn('webkitGetAsEntry directory scan failed:', err);
        }
      }
    }

    return false;
  }

  /**
   * Finds a file in the directory by relative path or virtual file:/// URL.
   */
  function getFile(pathOrUrl: string): StoredDirectoryFile | null {
    if (!isLoaded.value) return null;

    let targetPath = pathOrUrl;

    if (targetPath.startsWith('file:///')) {
      const parsed = new URL(targetPath);
      // Format is /rootName/sub/path
      const prefix = `/${rootName.value}/`;
      if (parsed.pathname.startsWith(prefix)) {
        targetPath = decodeURIComponent(parsed.pathname.slice(prefix.length));
      } else {
        // Strip leading slash
        targetPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
      }
    } else if (targetPath.startsWith('file://')) {
      // file://rootName/sub/path
      const parsed = new URL(targetPath);
      targetPath = decodeURIComponent(parsed.pathname.replace(/^\/+/, ''));
    }

    // Clean up leading relative dot-slash or slashes (e.g. ./assets/style.css -> assets/style.css)
    targetPath = targetPath.replace(/^\.\//, '').replace(/^\/+/, '');

    // Try exact path in map
    const direct = filesMap.value.get(targetPath);
    if (direct) return direct;

    // Try case-insensitive or stripped path
    const normalized = targetPath.toLowerCase();
    for (const [key, file] of filesMap.value.entries()) {
      if (key.toLowerCase() === normalized) return file;
    }

    // Try match ending with targetPath (e.g. "assets/css/main.css" matching "main.css")
    for (const [key, file] of filesMap.value.entries()) {
      if (key.endsWith('/' + targetPath) || key === targetPath) return file;
    }

    return null;
  }

  /**
   * Sets the active file path and updates IndexedDB.
   */
  async function setActivePath(path: string): Promise<void> {
    activePath.value = path;
    try {
      await updateActiveDirectoryPath(path);
    } catch (err) {
      console.warn('Failed to update active directory path in IndexedDB:', err);
    }
  }

  /**
   * Restores the saved directory project from IndexedDB on page reload.
   */
  async function restoreFromStorage(): Promise<boolean> {
    try {
      const stored = await getStoredDirectoryProject();
      if (!stored || stored.files.length === 0) return false;

      rootName.value = stored.rootName;
      activePath.value = stored.activePath;

      const map = new Map<string, StoredDirectoryFile>();
      for (const f of stored.files) {
        map.set(f.path, f);
      }
      filesMap.value = map;
      isLoaded.value = true;

      const rootFolder = buildDirectoryVfsTree(stored.files, stored.rootName);
      directoryVfsTree.value = [rootFolder];

      return true;
    } catch (err) {
      console.warn('Failed to restore directory project from IndexedDB:', err);
      return false;
    }
  }

  /**
   * Closes the directory and clears IndexedDB storage.
   */
  async function closeDirectory(): Promise<void> {
    isLoaded.value = false;
    rootName.value = '';
    activePath.value = '';
    filesMap.value = new Map();
    directoryVfsTree.value = [];

    try {
      await clearStoredDirectoryProject();
    } catch (err) {
      console.warn('Failed to clear directory project from IndexedDB:', err);
    }
  }

  return {
    isLoaded,
    rootName,
    activePath,
    filesMap,
    directoryVfsTree,
    initDirectory,
    pickDirectory,
    loadFromDataTransfer,
    getFile,
    setActivePath,
    restoreFromStorage,
    closeDirectory,
  };
}
