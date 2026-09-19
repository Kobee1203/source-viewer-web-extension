import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { sessionSnapshotStrategy } from '@/composables/source/strategies/sessionSnapshotStrategy';
import { SourceFetchError } from '@/composables/source/types';
import { saveSnapshot } from '@/composables/useLocalFile';

describe('sessionSnapshotStrategy', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('restores snapshot from sessionStorage successfully', async () => {
    saveSnapshot('index.html', '<h1>Hello</h1>', 'html');

    const result = await sessionSnapshotStrategy({ kind: 'snapshot' });

    expect(result.rawText).toBe('<h1>Hello</h1>');
    expect(result.fileName).toBe('index.html');
    expect(result.isLocalSnapshot).toBe(true);
    expect(result.detectedFileType).toBe('html');
    expect(result.snapshotTimestamp).toBeTypeOf('number');
  });

  it('throws SourceFetchError when no snapshot exists', async () => {
    await expect(sessionSnapshotStrategy({ kind: 'snapshot' })).rejects.toThrowError(SourceFetchError);
  });
});
