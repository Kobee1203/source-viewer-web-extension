import { defineContentScript } from '#imports';
import { viewerUrl } from '@/utils/viewerUrl';
import { HIDE_STYLE_ID } from '@/utils/inplace';

const IFRAME_ID = 'source-viewer-frame';

/**
 * Renders the formatted viewer in place on a direct CSS/JS/JSON/XML navigation,
 * keeping the address bar on the original URL (see `content.ts`).
 *
 * Never auto-injected — `registration: 'runtime'` excludes it from `manifest.json`'s
 * content_scripts (its `matches` are only merged into `host_permissions`). It's loaded
 * into a specific tab via `browser.scripting.executeScript` from the background, in
 * response to `content.ts` detecting a source-file navigation.
 *
 * It mounts our standalone `viewer.html?url=…` inside a full-viewport iframe rather
 * than a Shadow DOM overlay. A Shadow DOM host can't be attached in an XML document
 * (`attachShadow` rejects the null-namespace element the browser creates for e.g. a
 * direct `.xml` navigation), and its `:host { all: initial }` reset also skews the
 * viewer's font sizing. An extension-origin iframe sidesteps both: it's a real HTML
 * context, byte-for-byte identical to opening the viewer page directly.
 */
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'],
  allFrames: false,
  registration: 'runtime',
  main() {
    if (document.getElementById(IFRAME_ID)) return; // guard against a double injection

    // Create the iframe in the XHTML namespace so it's a valid HTML element even when
    // the host document is XML (createElement would otherwise produce a null-namespace
    // node). `visibility: visible` overrides the inherited `hidden` from content.ts's
    // hide-style, so the iframe shows while the raw content behind it stays hidden.
    const iframe = document.createElementNS('http://www.w3.org/1999/xhtml', 'iframe') as HTMLIFrameElement;
    iframe.id = IFRAME_ID;
    iframe.src = viewerUrl(location.href);
    // `width/height: 100%` (of the fixed viewport, excluding scrollbars) rather than
    // 100vw/100vh so the iframe never extends under the host page's scrollbar gutter.
    // `visibility: visible` overrides the inherited `hidden` from content.ts's hide-style.
    iframe.style.cssText = [
      'position: fixed',
      'inset: 0',
      'width: 100%',
      'height: 100%',
      'border: 0',
      'margin: 0',
      'z-index: 2147483647',
      'visibility: visible',
    ].join(';');

    // Reveal the raw page (removing content.ts's hide-style) if the iframe can't load
    // — e.g. the page's CSP forbids framing our extension origin.
    iframe.addEventListener('error', () => {
      iframe.remove();
      document.getElementById(HIDE_STYLE_ID)?.remove();
    });

    document.documentElement.appendChild(iframe);
  },
});
