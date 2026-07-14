import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { isRestricted } from '@/utils/restricted';
import {FetchSourceRequest, FetchSourceResponse} from '@/utils/messaging';
import type { OpenNativeRequest, OpenNativeResponse } from '@/utils/nativeViewer';

/** Builds the URL of our viewer page for a given target URL. */
function viewerUrlFor(target: URL): string {
  return (
    browser.runtime.getURL('/viewer.html') +
    '?url=' +
    encodeURIComponent(target.toString())
  );
}

export default defineBackground(() => {
  // Tabs the user explicitly sent to the native view-source viewer. Keyed by
  // tab id so the allowance survives server redirects within the same tab
  // (e.g. wikipedia.org strips query params on a 301). Cleared once the tab
  // finishes loading, so later manual view-source: navigations are captured.
  const nativeAllow = new Set<number>();

  /** Opens `url` in the native view-source viewer and remembers the tab so we don't recapture it. */
  async function openNative(
    message: OpenNativeRequest,
    senderTabId: number | undefined,
  ): Promise<OpenNativeResponse> {
    const viewSourceUrl = 'view-source:' + message.url;
    let tabId = senderTabId;
    try {
      if (message.newTab) {
        // Create the tab blank first so we can register its id before it starts
        // loading the view-source: URL (otherwise onUpdated could race us).
        const tab = await browser.tabs.create({ active: true });
        tabId = tab.id;
      }
      if (tabId === undefined) return { ok: false, error: 'no target tab' };

      nativeAllow.add(tabId);
      await browser.tabs.update(tabId, { url: viewSourceUrl });
      return { ok: true };
    } catch (err) {
      if (tabId !== undefined) nativeAllow.delete(tabId);
      return { ok: false, error: (err as Error).message };
    }
  }

  async function fetchSource(message: FetchSourceRequest): Promise<FetchSourceResponse> {
    return fetch(message.url, {
      headers: { Accept: 'text/html,text/plain,*/*' },
      credentials: 'omit',
    })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res.text();
    })
    .then((text): FetchSourceResponse => ({ ok: true, text }))
    .catch((err): FetchSourceResponse => ({ ok: false, error: err.message }));
  }

  // Toolbar icon: open our viewer for the current tab (or native view-source when restricted).
  browser.action.onClicked.addListener((tab) => {
    let url = tab.url;
    if (!url) return;

    if (url.startsWith('view-source:')) {
      url = url.replace(/^view-source:/, '');
    }
    if (!url.startsWith('http')) return;

    const targetUrl = new URL(url);
    if (isRestricted(targetUrl)) {
      browser.tabs.create({ url: 'view-source:' + targetUrl.toString() });
      return;
    }
    browser.tabs.create({ url: viewerUrlFor(targetUrl) });
  });

  // Intercept navigations to view-source: and redirect them to our viewer,
  // unless the user explicitly asked for the native viewer in this tab.
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      nativeAllow.delete(tabId); // one-shot allowance ends with the load
      return;
    }
    if (changeInfo.status !== 'loading') return;

    const url = tab.url || changeInfo.url || '';
    if (!url.startsWith('view-source:')) return;
    if (nativeAllow.has(tabId)) return;

    const targetUrl = new URL(url.slice('view-source:'.length));
    if (isRestricted(targetUrl)) return;

    browser.tabs.update(tabId, { url: viewerUrlFor(targetUrl) });
  });

  browser.runtime.onMessage.addListener(
    (
      message,
      sender,
    ): Promise<FetchSourceResponse> | Promise<OpenNativeResponse> | false => {
      if (typeof message !== 'object' || message === null) return false;
      const type = (message as { type?: unknown }).type;

      // Open a target URL in the browser's native view-source viewer.
      if (type === 'OPEN_NATIVE') {
        return openNative(message as OpenNativeRequest, sender.tab?.id);
      }

      // Fetch page source on behalf of the viewer (avoids page CORS/CSP constraints).
      if (type === 'FETCH_SOURCE') {
        return fetchSource(message as FetchSourceRequest);
      }

      return false;
    },
  );
});
