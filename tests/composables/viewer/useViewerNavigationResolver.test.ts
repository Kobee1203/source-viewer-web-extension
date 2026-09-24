import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useViewerNavigationResolver } from '@/composables/viewer/useViewerNavigationResolver';
import type { VfsFileNode } from '@/utils/buildVfsTree';
import type { ReferenceEntry } from '@/utils/extractReferences';

describe('useViewerNavigationResolver', () => {
  const localDirectory = useLocalDirectory();
  const sidebar = useReferenceSidebar();

  function createFileNode(overrides: Partial<VfsFileNode> = {}): VfsFileNode {
    return {
      kind: 'file',
      name: 'style.css',
      url: 'file:///app/style.css',
      linkTarget: 'source',
      fileType: 'css',
      count: 1,
      isExplored: false,
      isLoading: false,
      hasReferences: null,
      isExpanded: false,
      references: [],
      ...overrides,
    };
  }

  function createReferenceEntry(overrides: Partial<ReferenceEntry> = {}): ReferenceEntry {
    return {
      url: 'file:///app/assets/app.js',
      filename: 'app.js',
      linkTarget: 'source',
      fileType: 'javascript',
      count: 1,
      ...overrides,
    };
  }

  beforeEach(async () => {
    await localDirectory.closeDirectory();
    sidebar.reset();
  });

  it('navigates to local directory file on sidebar click if loaded', async () => {
    await localDirectory.initDirectory('app', [
      { path: 'style.css', name: 'style.css', type: 'css', size: 10, text: 'body {}' },
    ]);

    const load = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const resolver = useViewerNavigationResolver({
      localDirectory,
      sidebar,
      load,
      loadFromDirectoryFile,
    });

    resolver.onSidebarNavigate(createFileNode());

    expect(sidebar.activeUrl.value).toBe('file:///app/style.css');
    expect(loadFromDirectoryFile).toHaveBeenCalledWith('style.css');
    expect(load).not.toHaveBeenCalled();
  });

  it('falls back to sidebar navigateTo when directory is not loaded', () => {
    const load = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const navigateToSpy = vi.spyOn(sidebar, 'navigateTo');

    const resolver = useViewerNavigationResolver({
      localDirectory,
      sidebar,
      load,
      loadFromDirectoryFile,
    });

    const node = createFileNode({
      name: 'remote.js',
      url: 'https://example.com/remote.js',
      fileType: 'javascript',
    });

    resolver.onSidebarNavigate(node);

    expect(navigateToSpy).toHaveBeenCalledWith(node, load);
    expect(loadFromDirectoryFile).not.toHaveBeenCalled();
  });

  it('handles shortcut navigation for directory files', async () => {
    await localDirectory.initDirectory('app', [
      { path: 'assets/app.js', name: 'app.js', type: 'javascript', size: 20, text: 'var x = 1;' },
    ]);

    const load = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const resolver = useViewerNavigationResolver({
      localDirectory,
      sidebar,
      load,
      loadFromDirectoryFile,
    });

    resolver.onSidebarNavigateShortcut(createReferenceEntry());

    expect(sidebar.activeUrl.value).toBe('file:///app/assets/app.js');
    expect(loadFromDirectoryFile).toHaveBeenCalledWith('assets/app.js');
  });

  it('intercepts link clicks and resolves local file URLs', async () => {
    await localDirectory.initDirectory('app', [
      { path: 'styles/main.css', name: 'main.css', type: 'css', size: 15, text: 'h1 {}' },
    ]);

    const load = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const resolver = useViewerNavigationResolver({
      localDirectory,
      sidebar,
      load,
      loadFromDirectoryFile,
    });

    const event = new MouseEvent('click', { cancelable: true });
    const preventSpy = vi.spyOn(event, 'preventDefault');

    resolver.onLinkClick({
      rawUrl: 'styles/main.css',
      targetUrl: 'chrome-extension://test/viewer/index.html?url=file%3A%2F%2F%2Fapp%2Fstyles%2Fmain.css',
      event,
    });

    expect(preventSpy).toHaveBeenCalled();
    expect(sidebar.activeUrl.value).toBe('file:///app/styles/main.css');
    expect(loadFromDirectoryFile).toHaveBeenCalledWith('styles/main.css');
  });
});
