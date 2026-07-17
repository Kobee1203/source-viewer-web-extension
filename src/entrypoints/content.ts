import { defineContentScript } from '#imports';
import { detectRedirectFileType } from '@/utils/contentType';
import { requestViewerInjection } from '@/utils/messaging';
import { HIDE_STYLE_ID } from '@/utils/inplace';

/**
 * Auto-opens the in-place code viewer when navigating directly to raw CSS/JS/JSON/XML.
 *
 * Runs only on top-frame http(s) navigations (`allFrames: false`). It reads the
 * response MIME (`document.contentType`) at `document_start` and, when the content
 * is a source type we handle, hides the raw page and asks the background to inject
 * the heavy `inplace-viewer` content script into this tab. `text/html`, `view-source:`
 * pages and our own extension pages never match.
 *
 * Kept intentionally tiny (no Vue/Prism/js-beautify) since it's always-on for every
 * http(s) page — the real work lives in `inplace-viewer.content.ts`, only loaded
 * on demand via `browser.scripting.executeScript`.
 */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: false,
  async main() {
    const type = detectRedirectFileType(document.contentType, new URL(location.href));
    if (!type) return; // not a handled source type — leave the page alone

    // Hide the raw content immediately to avoid a flash before the viewer takes
    // over. `document.documentElement` always exists at document_start.
    // Created in the XHTML namespace and selected via `:root` (not `html`) so it
    // also works in XML documents: there `createElement('style')` would yield an
    // inert null-namespace element, and the root isn't <html> (e.g. a direct .xml
    // navigation renders an <rss> root).
    const hideStyle = document.createElementNS('http://www.w3.org/1999/xhtml', 'style');
    hideStyle.id = HIDE_STYLE_ID;
    hideStyle.textContent = ':root { visibility: hidden !important; }';
    document.documentElement.appendChild(hideStyle);

    let injected = false;
    try {
      ({ inject: injected } = await requestViewerInjection(location.href));
    } catch (err) {
      console.error(err);
    }

    if (!injected) {
      // Restricted URL, tab gone, or injection failed: reveal the raw page.
      document.getElementById(HIDE_STYLE_ID)?.remove();
    }
  },
});
