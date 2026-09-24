import { browser } from 'wxt/browser';
import { defineContentScript } from '#imports';
import { fetchHostSource } from '@/utils/fetchHostSource';
import { isHtmlDocument } from '@/utils/fileType';
import { extractHostSource } from '@/utils/hostSource';
import type { TabSourceCaptureResult } from '@/utils/tabSourceCapture';

/**
 * On-demand content script injected via `browser.scripting.executeScript` to capture
 * the raw source of an active tab without code duplication.
 *
 * It executes the capture cascade directly in the tab:
 * 1. Tries same-origin `force-cache` fetch via `fetchHostSource` (gets unmutated original source).
 * 2. Falls back to DOM extraction via `extractHostSource`.
 * 3. Sends the result back to the background script via `browser.runtime.sendMessage`.
 */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*', 'file:///*'],
  allFrames: false,
  registration: 'runtime',
  async main() {
    let result: TabSourceCaptureResult;

    const fetched = await fetchHostSource();
    if (fetched) {
      result = {
        text: fetched.text,
        byteSize: fetched.byteSize,
        isDomFallback: false,
        contentType: fetched.contentType,
        characterSet: fetched.characterSet,
      };
    } else {
      const isHtml = isHtmlDocument(location.pathname, document.contentType);
      const text = extractHostSource();
      result = {
        text,
        byteSize: new Blob([text]).size,
        isDomFallback: true,
        contentType: isHtml ? 'text/html' : document.contentType,
        characterSet: document.characterSet,
      };
    }

    try {
      await browser.runtime.sendMessage({
        type: 'TAB_SOURCE_CAPTURED',
        result,
      });
    } catch {
      // Ignore send error if background already stopped listening
    }
  },
});
