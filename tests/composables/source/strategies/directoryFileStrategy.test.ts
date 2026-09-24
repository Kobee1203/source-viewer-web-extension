import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { directoryFileStrategy } from '@/composables/source/strategies/directoryFileStrategy';
import { SourceFetchError } from '@/composables/source/types';
import { useLocalDirectory } from '@/composables/useLocalDirectory';

describe('directoryFileStrategy', () => {
  const dir = useLocalDirectory();

  beforeEach(async () => {
    await dir.initDirectory('fixtures', [
      {
        path: 'sample.html',
        name: 'sample.html',
        type: 'html',
        size: 50,
        text: '<h1>Sample</h1>',
      },
      {
        path: 'assets/css/main.css',
        name: 'main.css',
        type: 'css',
        size: 30,
        text: 'body { margin: 0; }',
      },
    ]);
  });

  afterEach(async () => {
    await dir.closeDirectory();
  });

  it('loads file content from directory-file target', async () => {
    const payload = await directoryFileStrategy({
      kind: 'directory-file',
      path: 'sample.html',
    });

    expect(payload.rawText).toBe('<h1>Sample</h1>');
    expect(payload.byteSize).toBe(50);
    expect(payload.fileName).toBe('sample.html');
    expect(payload.detectedFileType).toBe('html');
    expect(payload.isDirectoryFile).toBe(true);
    expect(payload.targetUrl?.toString()).toBe('file:///fixtures/sample.html');
  });

  it('loads file content from URL target matching loaded directory', async () => {
    const payload = await directoryFileStrategy({
      kind: 'url',
      url: new URL('file:///fixtures/assets/css/main.css'),
    });

    expect(payload.rawText).toBe('body { margin: 0; }');
    expect(payload.fileName).toBe('main.css');
    expect(payload.detectedFileType).toBe('css');
    expect(payload.isDirectoryFile).toBe(true);
  });

  it('throws SourceFetchError when file is not found', async () => {
    await expect(
      directoryFileStrategy({
        kind: 'directory-file',
        path: 'missing.js',
      }),
    ).rejects.toThrow(SourceFetchError);
  });
});
