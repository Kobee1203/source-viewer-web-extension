import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fileObjectStrategy } from '@/composables/source/strategies/fileObjectStrategy';
import { getStoredSnapshot } from '@/composables/useLocalFile';

describe('fileObjectStrategy', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('reads File object and persists snapshot when no handle is provided', async () => {
    const file = new File(['let a = 1;'], 'app.js', { type: 'application/javascript' });

    const result = await fileObjectStrategy({
      kind: 'file',
      file,
    });

    expect(result.rawText).toBe('let a = 1;');
    expect(result.fileName).toBe('app.js');
    expect(result.isLocalSnapshot).toBe(true);
    expect(result.fileHandle).toBeNull();

    const snapshot = getStoredSnapshot();
    expect(snapshot?.name).toBe('app.js');
    expect(snapshot?.text).toBe('let a = 1;');
  });

  it('preserves fileHandle and skips snapshot when handle is present', async () => {
    const file = new File(['{"ok":true}'], 'data.json', { type: 'application/json' });
    const mockHandle = {
      name: 'data.json',
      kind: 'file',
      getFile: () => Promise.resolve(file),
    } as unknown as FileSystemFileHandle;

    const result = await fileObjectStrategy({
      kind: 'file',
      file,
      handle: mockHandle,
    });

    expect(result.rawText).toBe('{"ok":true}');
    expect(result.fileHandle).toBe(mockHandle);
    expect(result.isLocalSnapshot).toBe(false);

    // No snapshot should be stored when handle is active
    expect(getStoredSnapshot()).toBeNull();
  });
});
