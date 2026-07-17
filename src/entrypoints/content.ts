import { defineContentScript } from '#imports';
import { detectRedirectFileType } from '@/utils/contentType';
import { requestAutoOpen } from '@/utils/messaging';

/**
 * Auto-opens the code viewer when navigating directly to raw CSS/JS/JSON/XML.
 *
 * Runs only on top-frame http(s) navigations (`allFrames: false`). It reads the
 * response MIME (`document.contentType`) at `document_start` and, when the
 * content is a source type we handle, asks the background to redirect the tab
 * (the background owns tab redirects — no `web_accessible_resources` needed).
 * `text/html`, `view-source:` pages and our own extension pages never match.
 */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  runAt: 'document_start',
  allFrames: false,
  main() {
    const type = detectRedirectFileType(document.contentType, new URL(location.href));
    if (!type) return; // not a handled source type — leave the page alone
    void requestAutoOpen(location.href);
  },
});
