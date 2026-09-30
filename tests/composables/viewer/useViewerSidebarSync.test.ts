import { nextTick, ref } from 'vue';
import { withSetup } from '@@/tests/helpers/withSetup';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useViewerSidebarSync } from '@/composables/viewer/useViewerSidebarSync';

describe('useViewerSidebarSync', () => {
  const originalLocation = window.location.href;
  const [localDirectory] = withSetup(useLocalDirectory);
  const [sidebar] = withSetup(useReferenceSidebar);

  beforeEach(async () => {
    await localDirectory.closeDirectory();
    sidebar.reset();
    sidebar.isOpen.value = false;
  });

  afterEach(() => {
    history.replaceState(null, '', originalLocation);
    vi.restoreAllMocks();
  });

  it('updates sidebar on code/baseUrl change when sidebar is open', async () => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/app.js');

    const code = ref('');
    const baseUrl = ref('');
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);

    const initFromSourceSpy = vi.spyOn(sidebar, 'initFromSource');

    const [, app] = withSetup(() =>
      useViewerSidebarSync({
        localDirectory,
        sidebar,
        code,
        baseUrl,
        loading,
        errorMessage,
      }),
    );

    sidebar.isOpen.value = true;
    code.value = 'console.log("hello");';
    baseUrl.value = 'https://example.com/app.js';
    await nextTick();

    expect(sidebar.activeUrl.value).toBe('https://example.com/app.js');
    expect(initFromSourceSpy).toHaveBeenCalledWith('console.log("hello");', 'https://example.com/app.js', false);

    app.unmount();
  });

  it('updates activeUrl, reveals node, and syncs VFS even when code is empty (e.g. font file)', async () => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/font.woff2');

    const code = ref('');
    const baseUrl = ref('');
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);

    const revealNodeSpy = vi.spyOn(sidebar, 'revealNode');
    const initFromSourceSpy = vi.spyOn(sidebar, 'initFromSource');

    const [, app] = withSetup(() =>
      useViewerSidebarSync({
        localDirectory,
        sidebar,
        code,
        baseUrl,
        loading,
        errorMessage,
      }),
    );

    sidebar.isOpen.value = true;
    baseUrl.value = 'https://example.com/font.woff2';
    await nextTick();

    expect(sidebar.activeUrl.value).toBe('https://example.com/font.woff2');
    expect(revealNodeSpy).toHaveBeenCalledWith('https://example.com/font.woff2');
    expect(initFromSourceSpy).toHaveBeenCalledWith('', 'https://example.com/font.woff2', false);

    app.unmount();
  });

  it('handles load error when fetch fails', async () => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/404.js');

    const code = ref('');
    const baseUrl = ref('');
    const loading = ref(true);
    const errorMessage = ref<string | null>(null);

    const handleLoadErrorSpy = vi.spyOn(sidebar, 'handleLoadError');

    const [, app] = withSetup(() =>
      useViewerSidebarSync({
        localDirectory,
        sidebar,
        code,
        baseUrl,
        loading,
        errorMessage,
      }),
    );

    errorMessage.value = 'Network error';
    loading.value = false;
    await nextTick();

    expect(handleLoadErrorSpy).toHaveBeenCalled();

    app.unmount();
  });
});
