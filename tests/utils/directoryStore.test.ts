import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  type StoredDirectoryFile,
  type StoredDirectoryProject,
  clearStoredDirectoryProject,
  getStoredDirectoryProject,
  saveDirectoryProject,
  updateActiveDirectoryPath,
} from '@/utils/directoryStore';

describe('directoryStore', () => {
  describe('when indexedDB is undefined', () => {
    it('returns null and does not throw', async () => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      await expect(saveDirectoryProject('test', 'a.html', [])).resolves.toBeUndefined();
      await expect(getStoredDirectoryProject()).resolves.toBeNull();
      await expect(updateActiveDirectoryPath('b.html')).resolves.toBeUndefined();
      await expect(clearStoredDirectoryProject()).resolves.toBeUndefined();
    });
  });

  describe('with mock indexedDB', () => {
    const memoryStore = new Map<string, StoredDirectoryProject>();

    beforeEach(() => {
      memoryStore.clear();

      const mockDb = {
        objectStoreNames: { contains: () => true },
        createObjectStore: () => ({}),
        close: () => {},
        transaction: () => ({
          oncomplete: null as (() => void) | null,
          objectStore: () => ({
            put: (value: StoredDirectoryProject) => {
              memoryStore.set(value.id, { ...value });
              const req = { onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
              setTimeout(() => {
                req.onsuccess?.();
              }, 0);
              return req;
            },
            get: (key: string) => {
              const req = {
                result: memoryStore.get(key),
                onsuccess: null as (() => void) | null,
                onerror: null as (() => void) | null,
              };
              setTimeout(() => {
                req.onsuccess?.();
              }, 0);
              return req;
            },
            delete: (key: string) => {
              memoryStore.delete(key);
              const req = { onsuccess: null as (() => void) | null, onerror: null as (() => void) | null };
              setTimeout(() => {
                req.onsuccess?.();
              }, 0);
              return req;
            },
          }),
        }),
      };

      Object.defineProperty(globalThis, 'indexedDB', {
        value: {
          open: () => {
            const req = {
              result: mockDb,
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              onupgradeneeded: null as (() => void) | null,
            };
            setTimeout(() => {
              req.onsuccess?.();
            }, 0);
            return req;
          },
        },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'indexedDB', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('saves and retrieves directory project', async () => {
      const files: StoredDirectoryFile[] = [
        {
          path: 'sample.html',
          name: 'sample.html',
          type: 'html',
          size: 100,
          text: '<h1>Hello</h1>',
        },
      ];

      await saveDirectoryProject('my-project', 'sample.html', files);
      const stored = await getStoredDirectoryProject();

      expect(stored).not.toBeNull();
      expect(stored?.rootName).toBe('my-project');
      expect(stored?.activePath).toBe('sample.html');
      expect(stored?.files).toHaveLength(1);
      expect(stored?.files[0].path).toBe('sample.html');
    });

    it('updates active directory path', async () => {
      const files: StoredDirectoryFile[] = [
        { path: 'a.html', name: 'a.html', type: 'html', size: 10 },
        { path: 'b.html', name: 'b.html', type: 'html', size: 10 },
      ];

      await saveDirectoryProject('my-project', 'a.html', files);
      await updateActiveDirectoryPath('b.html');

      const stored = await getStoredDirectoryProject();
      expect(stored?.activePath).toBe('b.html');
    });

    it('clears stored directory project', async () => {
      await saveDirectoryProject('my-project', 'a.html', []);
      expect(await getStoredDirectoryProject()).not.toBeNull();

      await clearStoredDirectoryProject();
      expect(await getStoredDirectoryProject()).toBeNull();
    });
  });
});
