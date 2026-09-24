import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { useReferenceSidebar } from '@/composables/useReferenceSidebar';
import { useViewerSidebarSync } from '@/composables/viewer/useViewerSidebarSync';

describe('useViewerSidebarSync', () => {
  const originalLocation = window.location.href;
  const localDirectory = useLocalDirectory();
  const sidebar = useReferenceSidebar();

  beforeEach(async () => {
    await localDirectory.closeDirectory();
    sidebar.reset();
    sidebar.isOpen.value = false;
  });

  afterEach(() => {
    history.replaceState(null, '', originalLocation);
    vi.restoreAllMocks();
  });

  function mountComposable(setupFn: () => void) {
    const app = createApp(
      defineComponent({
        setup() {
          setupFn();
          return () => h('div');
        },
      }),
    );
    const container = document.createElement('div');
    app.mount(container);
    return {
      unmount: () => app.unmount(),
    };
  }

  it('updates sidebar on code/baseUrl change when sidebar is open', async () => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/app.js');

    const code = ref('');
    const baseUrl = ref('');
    const loading = ref(false);
    const errorMessage = ref<string | null>(null);

    const initFromSourceSpy = vi.spyOn(sidebar, 'initFromSource');

    const { unmount } = mountComposable(() => {
      useViewerSidebarSync({
        localDirectory,
        sidebar,
        code,
        baseUrl,
        loading,
        errorMessage,
      });
    });

    sidebar.isOpen.value = true;
    code.value = 'console.log("hello");';
    baseUrl.value = 'https://example.com/app.js';
    await nextTick();

    expect(initFromSourceSpy).toHaveBeenCalledWith('console.log("hello");', 'https://example.com/app.js', false);

    unmount();
  });

  it('handles load error when fetch fails', async () => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/404.js');

    const code = ref('');
    const baseUrl = ref('');
    const loading = ref(true);
    const errorMessage = ref<string | null>(null);

    const handleLoadErrorSpy = vi.spyOn(sidebar, 'handleLoadError');

    const { unmount } = mountComposable(() => {
      useViewerSidebarSync({
        localDirectory,
        sidebar,
        code,
        baseUrl,
        loading,
        errorMessage,
      });
    });

    errorMessage.value = 'Network error';
    loading.value = false;
    await nextTick();

    expect(handleLoadErrorSpy).toHaveBeenCalled();

    unmount();
  });
});
