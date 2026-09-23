import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useViewerNavigation } from '@/composables/source/useViewerNavigation';

describe('useViewerNavigation', () => {
  const originalLocation = window.location.href;

  beforeEach(() => {
    history.replaceState(null, '', '/viewer.html?url=https://example.com/style.css&fileAccess=0');
  });

  afterEach(() => {
    history.replaceState(null, '', originalLocation);
  });

  it('reads initial query parameters correctly', () => {
    const nav = useViewerNavigation();
    expect(nav.currentUrl.value).toBe('https://example.com/style.css');
    expect(nav.rootUrl.value).toBeNull();
    expect(nav.fileAccessDisallowed.value).toBe(true);
  });

  it('updates url and preserves root parameter on navigateTo', () => {
    const nav = useViewerNavigation();
    nav.navigateTo('https://example.com/reset.css');

    expect(nav.currentUrl.value).toBe('https://example.com/reset.css');
    expect(nav.rootUrl.value).toBe('https://example.com/style.css');
    expect(window.location.search).toContain('root=https%3A%2F%2Fexample.com%2Fstyle.css');
    expect(window.location.search).toContain('url=https%3A%2F%2Fexample.com%2Freset.css');
  });

  it('resets query parameters and reactive state on clearUrl', () => {
    const nav = useViewerNavigation();
    expect(nav.currentUrl.value).toBe('https://example.com/style.css');
    expect(window.location.search).toContain('url=https://example.com/style.css');

    nav.clearUrl();

    expect(nav.currentUrl.value).toBeNull();
    expect(nav.rootUrl.value).toBeNull();
    expect(nav.fileAccessDisallowed.value).toBe(false);
    expect(window.location.search).toBe('');
  });
});
