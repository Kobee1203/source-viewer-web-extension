/**
 * Id of the `<style>` element `content.ts` inserts into `document.documentElement`
 * to hide the raw page before the in-place viewer takes over (or reveals it again
 * on failure/restriction). Shared with `inplace-viewer.content.ts`: the two content
 * scripts build as separate bundles but run in the same page and must agree on the
 * element to find/remove.
 */
export const HIDE_STYLE_ID = 'source-viewer-hide';

/** Id of the full-viewport `<iframe>` injected by `inplace-viewer.content.ts`. */
export const IFRAME_ID = 'source-viewer-frame';

/** Data attribute marking favicon `<link>` elements injected by `setInplaceFavicon`. */
export const FAVICON_ATTR = 'data-source-viewer-favicon';
