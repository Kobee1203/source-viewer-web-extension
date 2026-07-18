/** How a linkified URL found in the source should be opened. */
export type LinkTarget = 'image' | 'font' | 'source';

// Classification is by path extension only (query string ignored). An image/font
// URL without an extension falls through to `source` — an accepted limitation.
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.bmp', '.ico', '.svg'];
const FONT_EXTENSIONS = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];

/**
 * Classifies a resolved link URL by its path extension:
 * - `image` → let the browser render it natively
 * - `font` → a dedicated font viewer (not built yet — callers treat it as `source` for now)
 * - `source` → our code viewer (default; also covers extensionless URLs)
 */
export function classifyLinkTarget(url: URL): LinkTarget {
  const pathname = url.pathname.toLowerCase();
  if (IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return 'image';
  if (FONT_EXTENSIONS.some((ext) => pathname.endsWith(ext))) return 'font';
  return 'source';
}
