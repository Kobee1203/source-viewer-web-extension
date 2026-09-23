const DB_NAME = 'source_viewer_db';
const DB_VERSION = 1;
const STORE_NAME = 'directory_projects';
const ACTIVE_PROJECT_ID = 'active_directory';

export interface StoredDirectoryFile {
  path: string;
  name: string;
  type: string;
  size: number;
  text?: string;
  isBinary?: boolean;
}

export interface StoredDirectoryProject {
  id: string;
  rootName: string;
  activePath: string;
  timestamp: number;
  files: StoredDirectoryFile[];
}

function isIndexedDbAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

function toError(error: unknown, fallbackMessage = 'IndexedDB request failed'): Error {
  if (error instanceof Error) return error;
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message);
  }
  return new Error(fallbackMessage);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error('IndexedDB is not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(toError(request.error));
  });
}

/**
 * Saves the active directory project and all its file contents to IndexedDB.
 */
export async function saveDirectoryProject(
  rootName: string,
  activePath: string,
  files: StoredDirectoryFile[],
): Promise<void> {
  if (!isIndexedDbAvailable()) return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const project: StoredDirectoryProject = {
      id: ACTIVE_PROJECT_ID,
      rootName,
      activePath,
      timestamp: Date.now(),
      files,
    };

    const request = store.put(project);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(toError(request.error));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieves the stored directory project from IndexedDB if one exists.
 */
export async function getStoredDirectoryProject(): Promise<StoredDirectoryProject | null> {
  if (!isIndexedDbAvailable()) return null;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const request = store.get(ACTIVE_PROJECT_ID);
    request.onsuccess = () => {
      const result = request.result as StoredDirectoryProject | undefined;
      resolve(result ?? null);
    };
    request.onerror = () => reject(toError(request.error));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Updates the active file path within the stored directory project without rewriting all files.
 */
export async function updateActiveDirectoryPath(activePath: string): Promise<void> {
  if (!isIndexedDbAvailable()) return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const getReq = store.get(ACTIVE_PROJECT_ID);
    getReq.onsuccess = () => {
      const project = getReq.result as StoredDirectoryProject | undefined;
      if (!project) {
        resolve();
        return;
      }
      project.activePath = activePath;
      project.timestamp = Date.now();
      const putReq = store.put(project);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(toError(putReq.error));
    };
    getReq.onerror = () => reject(toError(getReq.error));
    tx.oncomplete = () => db.close();
  });
}

/**
 * Clears the stored directory project from IndexedDB (e.g. when user closes the directory).
 */
export async function clearStoredDirectoryProject(): Promise<void> {
  if (!isIndexedDbAvailable()) return;

  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const request = store.delete(ACTIVE_PROJECT_ID);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(toError(request.error));
    tx.oncomplete = () => db.close();
  });
}
