import { ref } from 'vue';

/**
 * Manages viewer URL query parameters (`url`, `root`, `fileAccess`) and
 * browser history synchronization during internal navigation (e.g. Reference Sidebar).
 */
export function useViewerNavigation() {
  const currentUrl = ref<string | null>(null);
  const rootUrl = ref<string | null>(null);
  const fileAccessDisallowed = ref(false);

  function syncFromLocation(): void {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    currentUrl.value = searchParams.get('url');
    rootUrl.value = searchParams.get('root');
    fileAccessDisallowed.value = searchParams.get('fileAccess') === '0';
  }

  function navigateTo(explicitUrl: string): void {
    if (typeof window === 'undefined') return;
    const next = new URL(window.location.href);
    if (!next.searchParams.has('root')) {
      const activeUrl = next.searchParams.get('url');
      if (activeUrl) next.searchParams.set('root', activeUrl);
    }
    next.searchParams.set('url', explicitUrl);
    history.pushState(null, '', next.toString());
    syncFromLocation();
  }

  syncFromLocation();

  return {
    currentUrl,
    rootUrl,
    fileAccessDisallowed,
    syncFromLocation,
    navigateTo,
  };
}
