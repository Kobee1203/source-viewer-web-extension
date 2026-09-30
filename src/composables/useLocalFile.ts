import { formatFromUrl } from '@/composables/useFontLoad';
import { type FileType, extensionToFileType, isHtmlExtension } from '@/utils/fileType';
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
  fileType: FileType | 'font';
  timestamp: number;
  fontFormat?: string;
}

export interface PickedLocalFile {
  file: File;
  handle?: FileSystemFileHandle;
}

export type ReadLocalFileResult =
  | {
      isFont: true;
      text: string;
      fileType: 'font';
      buffer: ArrayBuffer;
      fontFormat: string;
    }
  | {
      isFont?: false;
      text: string;
      fileType: FileType;
      buffer?: undefined;
      fontFormat?: undefined;
    };

/**
 * Converts a File to a Data URL (base64 string) for storage or binary transport.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file as Data URL'));
    reader.readAsDataURL(file);
  });
}

/**
 * Saves an in-memory snapshot of a dropped file to sessionStorage so that
 * page reloads (F5 / Cmd+R) do not unexpectedly lose the viewed content.
 */
export function saveSnapshot(name: string, text: string, fileType: FileType | 'font', fontFormat?: string): void {
  try {
    const snapshot: StoredSnapshot = {
      name,
      text,
      fileType,
      timestamp: Date.now(),
      fontFormat,
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
        fontFormat: data.fontFormat,
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
            description: 'Source & Font files',
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
              'application/vnd.ms-fontobject': ['.eot'],
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
    input.accept = '.html,.htm,.js,.mjs,.cjs,.css,.json,.xml,.woff,.woff2,.ttf,.otf,.eot';
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
export async function readLocalFile(file: File): Promise<ReadLocalFileResult> {
  const dummyUrl = new URL('file:///' + file.name);
  if (classifyLinkTarget(dummyUrl) === 'font') {
    const [buffer, dataUrl] = await Promise.all([file.arrayBuffer(), fileToDataUrl(file)]);
    const fontFormat = formatFromUrl(file.name);
    return {
      text: dataUrl,
      fileType: 'font',
      isFont: true,
      buffer,
      fontFormat,
    };
  }

  const fileType = extensionToFileType(dummyUrl) ?? (isHtmlExtension(dummyUrl.pathname) ? 'html' : null);
  if (!fileType) {
    throw new Error(`UnsupportedFileType: ${file.name}`);
  }

  const text = await file.text();
  return { text, fileType };
}
