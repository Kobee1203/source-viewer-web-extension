import { describe, expect, it } from 'vitest';
import { type VfsFileNode, type VfsFolderNode, buildDirectoryVfsTree } from '@/utils/buildVfsTree';
import type { StoredDirectoryFile } from '@/utils/directoryStore';

describe('buildDirectoryVfsTree', () => {
  it('constructs a hierarchical VFS tree with correct structure and sorting', () => {
    const files: StoredDirectoryFile[] = [
      { path: 'assets/css/main.css', name: 'main.css', type: 'css', size: 100 },
      { path: 'assets/js/app.js', name: 'app.js', type: 'javascript', size: 200 },
      { path: 'sample.html', name: 'sample.html', type: 'html', size: 300 },
      { path: 'fonts/font.woff2', name: 'font.woff2', type: '', size: 500 },
    ];

    const root = buildDirectoryVfsTree(files, 'fixtures');

    expect(root.kind).toBe('folder');
    expect(root.name).toBe('fixtures');
    expect(root.isRootDomain).toBe(true);
    expect(root.isExpanded).toBe(true);

    // Root children: folders first ('assets', 'fonts'), then files ('sample.html')
    const childNames = root.children.map((c) => c.name);
    expect(childNames).toEqual(['assets', 'fonts', 'sample.html']);

    // Check assets folder
    const assetsFolder = root.children.find((c): c is VfsFolderNode => c.name === 'assets');
    expect(assetsFolder).toBeDefined();
    expect(assetsFolder?.children.map((c) => c.name)).toEqual(['css', 'js']);

    // Check css folder and file
    const cssFolder = assetsFolder?.children.find((c): c is VfsFolderNode => c.name === 'css');
    const mainCssFile = cssFolder?.children[0] as VfsFileNode;
    expect(mainCssFile.name).toBe('main.css');
    expect(mainCssFile.url).toBe('file:///fixtures/assets/css/main.css');
    expect(mainCssFile.fileType).toBe('css');
    expect(mainCssFile.linkTarget).toBe('source');

    // Check font file
    const fontsFolder = root.children.find((c): c is VfsFolderNode => c.name === 'fonts');
    const fontFile = fontsFolder?.children[0] as VfsFileNode;
    expect(fontFile.name).toBe('font.woff2');
    expect(fontFile.linkTarget).toBe('font');
  });

  it('handles flat directory with no subdirectories', () => {
    const files: StoredDirectoryFile[] = [
      { path: 'index.html', name: 'index.html', type: 'html', size: 50 },
      { path: 'README.md', name: 'README.md', type: '', size: 20 },
    ];

    const root = buildDirectoryVfsTree(files, 'my-repo');
    expect(root.children).toHaveLength(2);
    expect(root.children[0].name).toBe('index.html');
    expect(root.children[1].name).toBe('README.md');
  });
});
