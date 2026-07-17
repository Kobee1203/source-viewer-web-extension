import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { isRestricted } from '@/utils/restricted';
import {
  fetchSource,
  type AutoOpenRequest,
  type FetchSourceRequest,
  type FetchSourceResponse,
} from '@/utils/messaging';
import { createNativeViewerController, type OpenNativeRequest, type OpenNativeResponse } from '@/utils/nativeViewer';
import { viewerUrl } from '@/utils/viewerUrl';

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
      void browser.tabs.create({ url: 'view-source:' + targetUrl.toString() });
      return;
    }
    void browser.tabs.create({ url: viewerUrl(targetUrl.toString()) });
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

    void browser.tabs.update(tabId, { url: viewerUrl(targetUrl.toString()) });
  });

  // Returning a Promise is how a message listener replies asynchronously.
  // (no-misused-promises' argument check is relaxed for this file in eslint.config.)
  browser.runtime.onMessage.addListener(
    (message, sender): Promise<FetchSourceResponse> | Promise<OpenNativeResponse> | false => {
      if (typeof message !== 'object' || message === null) return false;
      const type = (message as { type?: unknown }).type;

      if (type === 'OPEN_NATIVE') {
        return nativeViewer.open(message as OpenNativeRequest, sender.tab?.id);
      }
      if (type === 'FETCH_SOURCE') {
        return fetchSource(message as FetchSourceRequest);
      }
      if (type === 'AUTO_OPEN') {
        // Content script detected a direct CSS/JS/JSON/XML navigation: redirect
        // the tab to our viewer (skip restricted URLs we couldn't fetch anyway).
        const tabId = sender.tab?.id;
        const rawUrl = (message as AutoOpenRequest).url;
        if (tabId !== undefined && !isRestricted(new URL(rawUrl))) {
          void browser.tabs.update(tabId, { url: viewerUrl(rawUrl) });
        }
        return false;
      }
      return false;
    },
  );
});
