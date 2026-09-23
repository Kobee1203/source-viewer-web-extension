import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import type { StoredDirectoryFile } from '@/utils/directoryStore';

describe('useLocalDirectory', () => {
  const dir = useLocalDirectory();

  beforeEach(async () => {
    await dir.closeDirectory();
  });

  it('initializes directory state and selects index.html as default entrypoint', async () => {
    const files: StoredDirectoryFile[] = [
      { path: 'assets/style.css', name: 'style.css', type: 'css', size: 100, text: 'body {}' },
      { path: 'index.html', name: 'index.html', type: 'html', size: 200, text: '<h1>Hi</h1>' },
    ];

    await dir.initDirectory('test-dir', files);

    expect(dir.isLoaded.value).toBe(true);
    expect(dir.rootName.value).toBe('test-dir');
    expect(dir.activePath.value).toBe('index.html');
    expect(dir.directoryVfsTree.value).toHaveLength(1);
    expect(dir.directoryVfsTree.value[0].name).toBe('test-dir');
  });

  it('selects sample.html if present and no index.html exists', async () => {
    const files: StoredDirectoryFile[] = [
      { path: 'assets/app.js', name: 'app.js', type: 'javascript', size: 100, text: 'console.log(1)' },
      { path: 'sample.html', name: 'sample.html', type: 'html', size: 200, text: '<h1>Sample</h1>' },
    ];

    await dir.initDirectory('fixtures', files);
    expect(dir.activePath.value).toBe('sample.html');
  });

  it('retrieves files by path and by virtual file:/// URL', async () => {
    const files: StoredDirectoryFile[] = [
      { path: 'assets/css/main.css', name: 'main.css', type: 'css', size: 50, text: '/* main */' },
      { path: 'sample.html', name: 'sample.html', type: 'html', size: 100, text: '<p>test</p>' },
    ];

    await dir.initDirectory('my-app', files);

    // Exact relative path
    const file1 = dir.getFile('assets/css/main.css');
    expect(file1).toBeDefined();
    expect(file1?.name).toBe('main.css');

    // Virtual URL
    const file2 = dir.getFile('file:///my-app/assets/css/main.css');
    expect(file2).toBeDefined();
    expect(file2?.name).toBe('main.css');

    // Suffix / basename match
    const file3 = dir.getFile('main.css');
    expect(file3).toBeDefined();
    expect(file3?.name).toBe('main.css');

    // Leading ./ relative path
    const file4 = dir.getFile('./assets/css/main.css');
    expect(file4).toBeDefined();
    expect(file4?.name).toBe('main.css');

    const file5 = dir.getFile('./sample.html');
    expect(file5).toBeDefined();
    expect(file5?.name).toBe('sample.html');

    // Non-existent
    expect(dir.getFile('non-existent.js')).toBeNull();
  });

  it('updates active path and resets state on close', async () => {
    const files: StoredDirectoryFile[] = [
      { path: 'a.html', name: 'a.html', type: 'html', size: 10, text: 'A' },
      { path: 'b.html', name: 'b.html', type: 'html', size: 10, text: 'B' },
    ];

    await dir.initDirectory('proj', files);
    expect(dir.activePath.value).toBe('a.html');

    await dir.setActivePath('b.html');
    expect(dir.activePath.value).toBe('b.html');

    await dir.closeDirectory();
    expect(dir.isLoaded.value).toBe(false);
    expect(dir.rootName.value).toBe('');
    expect(dir.activePath.value).toBe('');
    expect(dir.directoryVfsTree.value).toHaveLength(0);
  });
});
