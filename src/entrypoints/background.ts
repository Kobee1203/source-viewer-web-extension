import { defineBackground } from '#imports';
import { browser } from 'wxt/browser';
import { isRestricted } from '@/utils/restricted';
import {
  fetchSource,
  type FetchSourceRequest,
  type FetchSourceResponse,
  type RequestViewerInjectionRequest,
  type RequestViewerInjectionResponse,
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

  // content.ts detected a direct CSS/JS/JSON/XML navigation: inject the heavy
  // in-place viewer content script into that tab (skip restricted URLs we
  // couldn't fetch anyway, or a tab that's already gone by the time we run).
  async function injectViewer(
    request: RequestViewerInjectionRequest,
    tabId?: number,
  ): Promise<RequestViewerInjectionResponse> {
    if (tabId === undefined || isRestricted(new URL(request.url))) {
      return { inject: false };
    }
    try {
      await browser.scripting.executeScript({ target: { tabId }, files: ['/content-scripts/inplace-viewer.js'] });
      return { inject: true };
    } catch (err) {
      console.error(err);
      return { inject: false };
    }
  }

  // Returning a Promise is how a message listener replies asynchronously.
  // (no-misused-promises' argument check is relaxed for this file in eslint.config.)
  browser.runtime.onMessage.addListener(
    (
      message,
      sender,
    ): Promise<FetchSourceResponse> | Promise<OpenNativeResponse> | Promise<RequestViewerInjectionResponse> | false => {
      if (typeof message !== 'object' || message === null) return false;
      const type = (message as { type?: unknown }).type;

      if (type === 'OPEN_NATIVE') {
        return nativeViewer.open(message as OpenNativeRequest, sender.tab?.id);
      }
      if (type === 'FETCH_SOURCE') {
        return fetchSource(message as FetchSourceRequest);
      }
      if (type === 'REQUEST_VIEWER_INJECTION') {
        return injectViewer(message as RequestViewerInjectionRequest, sender.tab?.id);
      }
      return false;
    },
  );
});
