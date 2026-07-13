import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { isRestricted } from '../utils/restricted';
import type { FetchSourceResponse } from '../utils/messaging';

/** Builds the URL of our viewer page for a given target URL. */
function viewerUrlFor(target: URL): string {
  return (
    browser.runtime.getURL('/viewer.html') +
    '?url=' +
    encodeURIComponent(target.toString())
  );
}

/** True when the target should be handed to the browser's native view-source instead of our viewer. */
function shouldUseNative(target: URL): boolean {
  return (
    isRestricted(target) ||
    target.searchParams.get('useNativeViewer') === 'true'
  );
}

export default defineBackground(() => {
  // Toolbar icon: open our viewer for the current tab (or native view-source when restricted).
  browser.action.onClicked.addListener((tab) => {
    let url = tab.url;
    if (!url) return;

    if (url.startsWith('view-source:')) {
      url = url.replace(/^view-source:/, '');
    }
    if (!url.startsWith('http')) return;

    const targetUrl = new URL(url);
    if (shouldUseNative(targetUrl)) {
      browser.tabs.create({ url: 'view-source:' + targetUrl.toString() });
      return;
    }
    browser.tabs.create({ url: viewerUrlFor(targetUrl) });
  });

  // Intercept navigations to view-source: and redirect them to our viewer.
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'loading') return;
    const url = tab.url || changeInfo.url || '';
    if (!url.startsWith('view-source:')) return;

    const targetUrl = new URL(url.slice('view-source:'.length));
    if (shouldUseNative(targetUrl)) return;

    browser.tabs.update(tabId, { url: viewerUrlFor(targetUrl) });
  });

  // Fetch page source on behalf of the viewer (avoids page CORS/CSP constraints).
  browser.runtime.onMessage.addListener(
    (message): Promise<FetchSourceResponse> | false => {
      if (
        typeof message !== 'object' ||
        message === null ||
        (message as { type?: unknown }).type !== 'FETCH_SOURCE'
      ) {
        return false;
      }

      const { url } = message as { url: string };

      return fetch(url, {
        headers: { Accept: 'text/html,text/plain,*/*' },
        credentials: 'omit',
      })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
          return res.text();
        })
        .then((text): FetchSourceResponse => ({ ok: true, text }))
        .catch((err): FetchSourceResponse => ({ ok: false, error: err.message }));
    },
  );
});
