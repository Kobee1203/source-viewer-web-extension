import { browser } from 'wxt/browser';

/** Builds the URL of our font viewer page (`fontviewer.html?url=…`) for a given font URL. */
export function fontViewerUrl(target: string): string {
  return browser.runtime.getURL('/fontviewer.html') + '?url=' + encodeURIComponent(target);
}
