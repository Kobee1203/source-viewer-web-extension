import { browser } from 'wxt/browser';

/** Builds the URL of our viewer page (`viewer.html?url=…`) for a given target URL. */
export function viewerUrl(target: string): string {
  return browser.runtime.getURL('/viewer.html') + '?url=' + encodeURIComponent(target);
}
