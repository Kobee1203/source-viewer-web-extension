import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useViewerProjectActions } from '@/composables/viewer/useViewerProjectActions';

describe('useViewerProjectActions', () => {
  const localDirectory = useLocalDirectory();
  const sidebar = useReferenceSidebar();

  beforeEach(async () => {
    await localDirectory.closeDirectory();
    sidebar.reset();
    sidebar.isOpen.value = false;
  });

  it('openLocalFile resets loaded directory and loads file', async () => {
    await localDirectory.initDirectory('proj', [
      { path: 'index.html', name: 'index.html', type: 'html', size: 10, text: 'hi' },
    ]);
    expect(localDirectory.isLoaded.value).toBe(true);

    const clearUrl = vi.fn();
    const load = vi.fn(async () => {});
    const loadFromLocalFile = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const actions = useViewerProjectActions({
      localDirectory,
      sidebar,
      clearUrl,
      load,
      loadFromLocalFile,
      loadFromDirectoryFile,
    });

    const mockFile = new File(['content'], 'file.js');
    await actions.openLocalFile(mockFile);

    expect(localDirectory.isLoaded.value).toBe(false);
    expect(clearUrl).toHaveBeenCalled();
    expect(loadFromLocalFile).toHaveBeenCalledWith(mockFile, undefined);
  });

  it('onDirectoryLoaded sets sidebar tree and loads active path', async () => {
    await localDirectory.initDirectory('my-app', [
      { path: 'index.html', name: 'index.html', type: 'html', size: 10, text: 'hi' },
    ]);

    const clearUrl = vi.fn();
    const load = vi.fn(async () => {});
    const loadFromLocalFile = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const actions = useViewerProjectActions({
      localDirectory,
      sidebar,
      clearUrl,
      load,
      loadFromLocalFile,
      loadFromDirectoryFile,
    });

    actions.onDirectoryLoaded();

    expect(clearUrl).toHaveBeenCalled();
    expect(sidebar.vfsTree.value).toHaveLength(1);
    expect(sidebar.vfsTree.value[0].name).toBe('my-app');
    expect(loadFromDirectoryFile).toHaveBeenCalledWith('index.html');
  });

  it('openDirectory picks directory and triggers onDirectoryLoaded when successful', async () => {
    const clearUrl = vi.fn();
    const load = vi.fn(async () => {});
    const loadFromLocalFile = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    vi.spyOn(localDirectory, 'pickDirectory').mockResolvedValue(true);

    const actions = useViewerProjectActions({
      localDirectory,
      sidebar,
      clearUrl,
      load,
      loadFromLocalFile,
      loadFromDirectoryFile,
    });

    await actions.openDirectory();

    expect(localDirectory.pickDirectory).toHaveBeenCalled();
    expect(loadFromDirectoryFile).toHaveBeenCalled();
  });

  it('closeDirectory cleans up directory and sidebar and triggers reload', async () => {
    await localDirectory.initDirectory('my-app', [
      { path: 'index.html', name: 'index.html', type: 'html', size: 10, text: 'hi' },
    ]);
    sidebar.isOpen.value = true;

    const clearUrl = vi.fn();
    const load = vi.fn(async () => {});
    const loadFromLocalFile = vi.fn(async () => {});
    const loadFromDirectoryFile = vi.fn(async () => {});

    const actions = useViewerProjectActions({
      localDirectory,
      sidebar,
      clearUrl,
      load,
      loadFromLocalFile,
      loadFromDirectoryFile,
    });

    await actions.closeDirectory();

    expect(localDirectory.isLoaded.value).toBe(false);
    expect(sidebar.isOpen.value).toBe(false);
    expect(clearUrl).toHaveBeenCalled();
    expect(load).toHaveBeenCalled();
  });
});
