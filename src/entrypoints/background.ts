import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { isRestricted } from '@/utils/restricted';
import {
  fetchSource,
  type FetchSourceRequest,
  type FetchSourceResponse,
} from '@/utils/messaging';
import {
  createNativeViewerController,
  type OpenNativeRequest,
  type OpenNativeResponse,
} from '@/utils/nativeViewer';

/** Builds the URL of our viewer page for a given target URL. */
function viewerUrlFor(target: URL): string {
  return (
    browser.runtime.getURL('/viewer.html') +
    '?url=' +
    encodeURIComponent(target.toString())
  );
}

export default defineBackground(() => {
  const nativeViewer = createNativeViewerController();

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
      nativeViewer.forget(tabId); // one-shot allowance ends with the load
      return;
    }
    if (changeInfo.status !== 'loading') return;

    const url = tab.url || changeInfo.url || '';
    if (!url.startsWith('view-source:')) return;
    if (nativeViewer.isAllowed(tabId)) return;

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

      if (type === 'OPEN_NATIVE') {
        return nativeViewer.open(message as OpenNativeRequest, sender.tab?.id);
      }
      if (type === 'FETCH_SOURCE') {
        return fetchSource(message as FetchSourceRequest);
      }
      return false;
    },
  );
});
