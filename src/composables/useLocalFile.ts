import { type FileType, getFileType } from '@/utils/fileType';
import { classifyLinkTarget } from '@/utils/linkTarget';

const SNAPSHOT_STORAGE_KEY = 'sv_snapshot_data';

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      multiple?: boolean;
      types?: Array<{
        description?: string;
        accept: Record<string, string[]>;
      }>;
    }) => Promise<FileSystemFileHandle[]>;
  }
}

export interface StoredSnapshot {
  name: string;
  text: string;
  fileType: FileType;
  timestamp: number;
}

export interface PickedLocalFile {
  file: File;
  handle?: FileSystemFileHandle;
}

/**
 * Saves an in-memory snapshot of a dropped file to sessionStorage so that
 * page reloads (F5 / Cmd+R) do not unexpectedly lose the viewed content.
 */
export function saveSnapshot(name: string, text: string, fileType: FileType): void {
  try {
    const snapshot: StoredSnapshot = {
      name,
      text,
      fileType,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('Failed to save snapshot to sessionStorage:', err);
  }
}

/**
 * Retrieves the stored snapshot from sessionStorage, if present.
 */
export function getStoredSnapshot(): StoredSnapshot | null {
  try {
    const raw = sessionStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as Partial<StoredSnapshot>;
    if (typeof data.name === 'string' && typeof data.text === 'string' && typeof data.fileType === 'string') {
      return {
        name: data.name,
        text: data.text,
        fileType: data.fileType,
        timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now(),
      };
    }
  } catch (err) {
    console.warn('Failed to read snapshot from sessionStorage:', err);
  }
  return null;
}

/** Clears any stored snapshot in sessionStorage. */
export function clearStoredSnapshot(): void {
  try {
    sessionStorage.removeItem(SNAPSHOT_STORAGE_KEY);
  } catch {
    // Ignore storage clear errors
  }
}

/**
 * Opens a local file using the standard File System Access API (`window.showOpenFilePicker`)
 * or falls back to a hidden `<input type="file">` element.
 */
export async function pickLocalFile(): Promise<PickedLocalFile | null> {
  // Try modern File System Access API first (supported in Chromium browsers).
  if (typeof window.showOpenFilePicker === 'function') {
    try {
      const handles = await window.showOpenFilePicker({
        types: [
          {
            description: 'Source and font files',
            accept: {
              'text/html': ['.html', '.htm'],
              'text/javascript': ['.js', '.mjs', '.cjs'],
              'text/css': ['.css'],
              'application/json': ['.json'],
              'application/xml': ['.xml'],
              'font/woff2': ['.woff2'],
              'font/woff': ['.woff'],
              'font/ttf': ['.ttf'],
              'font/otf': ['.otf'],
            },
          },
        ],
        multiple: false,
      });
      const handle = handles[0];
      if (!handle) return null;
      const file = await handle.getFile();
      return { file, handle };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return null;
      }
      console.warn('showOpenFilePicker failed, falling back to input:', err);
    }
  }

  // Fallback: standard input[type=file] (Firefox and browsers without showOpenFilePicker)
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.html,.htm,.js,.mjs,.cjs,.css,.json,.xml,.woff2,.woff,.ttf,.otf';
    input.style.display = 'none';

    input.onchange = () => {
      const file = input.files?.[0];
      input.remove();
      if (file) {
        resolve({ file });
      } else {
        resolve(null);
      }
    };

    input.oncancel = () => {
      input.remove();
      resolve(null);
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Reads content and metadata from a local File object.
 */
export async function readLocalFile(file: File): Promise<{ text: string; fileType: FileType; isFont: boolean }> {
  const dummyUrl = new URL('file:///' + file.name);
  const isFont = classifyLinkTarget(dummyUrl) === 'font';
  const fileType = getFileType(dummyUrl);
  const text = isFont ? '' : await file.text();
  return { text, fileType, isFont };
}
