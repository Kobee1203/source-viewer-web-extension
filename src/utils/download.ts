import type { FileType } from '@/utils/fileType';

/**
 * Downloads the (formatted) source shown in the viewer — see the download button in `Toolbar.vue`.
 *
 * The file is named after (in priority order) the server's `Content-Disposition` filename, the
 * URL's last path segment when it looks like a filename, or a `download.<ext>` default. HTML is
 * post-processed so it renders correctly when opened locally: a `<base>` pointing at the original
 * URL lets the browser resolve every relative asset against the origin, and a leading
 * `<meta charset="utf-8">` matches our UTF-8 output. CSS can't carry a `<base>`, so a downloaded
 * stylesheet instead gets its relative `url(...)`/`@import` targets resolved to absolute against
 * its own URL (otherwise `url(../webfonts/…)` would break once the file lives on disk). Everything
 * is string surgery (no DOM/CSS parsing), consistent with the rest of the codebase.
 *
 * Known limitation: a downloaded HTML page still pulls its assets from the origin over the network
 * (it is not offline), and cross-origin webfonts are subject to CORS — a page opened from `file://`
 * has a `null` origin, so an `@font-face` served without `Access-Control-Allow-Origin` is blocked
 * and its glyphs won't render (unlike `<link>` CSS and `<img>`, which aren't CORS-checked). Full
 * offline/complete rendering would require fetching and embedding the subresources ourselves via
 * the background — a separate, deferred feature.
 */

/** Canonical extension per file type, used for the default filename. */
const EXTENSION: Record<FileType, string> = {
  html: '.html',
  javascript: '.js',
  css: '.css',
  json: '.json',
  xml: '.xml',
};

/** Blob MIME type per file type (charset reflects our UTF-8 output). */
const MIME: Record<FileType, string> = {
  html: 'text/html;charset=utf-8',
  javascript: 'text/javascript;charset=utf-8',
  css: 'text/css;charset=utf-8',
  json: 'application/json;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
};

/** Default base name (fixed, not localized — a filename shouldn't vary with the UI language). */
const DEFAULT_BASENAME = 'download';

/** Reduces a candidate filename to a bare basename (drops any path, guards against `../`). */
function basename(name: string): string {
  return name.split(/[\\/]/).pop()?.trim() ?? '';
}

/**
 * Extracts a filename from a `Content-Disposition` header, honoring the RFC 5987 `filename*`
 * form (percent-encoded, takes precedence) before the plain `filename`. Returns `null` when none.
 */
export function filenameFromContentDisposition(header: string | null | undefined): string | null {
  if (!header) return null;
  const extended = /filename\*\s*=\s*[^']*''([^;]+)/i.exec(header);
  if (extended) {
    try {
      return basename(decodeURIComponent(extended[1].trim()));
    } catch {
      // fall through to the plain form
    }
  }
  const plain = /filename\s*=\s*"?([^";]+)"?/i.exec(header);
  return plain ? basename(plain[1]) : null;
}

/** Whether a path segment already looks like a filename (ends with a `.ext` of 1–5 alphanumerics). */
function looksLikeFilename(segment: string): boolean {
  return /\.[A-Za-z0-9]{1,5}$/.test(segment);
}

/**
 * Derives the download filename: `Content-Disposition` → URL last path segment (when it looks
 * like a filename) → `download.<ext>` for the detected type.
 */
export function deriveFilename(target: URL, type: FileType, contentDisposition?: string | null): string {
  const fromHeader = filenameFromContentDisposition(contentDisposition);
  if (fromHeader) return fromHeader;

  const trimmed = target.pathname.replace(/\/+$/, '');
  let segment = trimmed.slice(trimmed.lastIndexOf('/') + 1);
  try {
    segment = decodeURIComponent(segment);
  } catch {
    // keep the raw segment if it isn't valid percent-encoding
  }
  if (segment && looksLikeFilename(segment)) return segment;

  return DEFAULT_BASENAME + EXTENSION[type];
}

/**
 * Injects `<meta charset="utf-8">` and a `<base href>` into an HTML document so it renders
 * correctly from `file://`. The charset is added unconditionally at the head start (the first
 * declaration wins, and our bytes are UTF-8). The base points at the original URL; if the page
 * already declares one, its (possibly relative) value is resolved against the URL in place rather
 * than adding a second base that would override the page's own.
 */
export function injectBaseAndCharset(html: string, target: URL): string {
  const charsetTag = '<meta charset="utf-8">';
  let out = html;
  let baseTag = `<base href="${target.toString()}">`;

  const existingBase = /<base\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/i.exec(out);
  if (existingBase) {
    let resolved = existingBase[1];
    try {
      resolved = new URL(existingBase[1], target).toString();
    } catch {
      // leave the original value if it can't be resolved
    }
    out = out.replace(existingBase[0], existingBase[0].replace(existingBase[1], resolved));
    baseTag = ''; // don't add a second base — the page's own (now absolute) one stays authoritative
  }

  const injection = charsetTag + baseTag;
  const headOpen = /<head\b[^>]*>/i;
  if (headOpen.test(out)) return out.replace(headOpen, (tag) => tag + injection);
  const htmlOpen = /<html\b[^>]*>/i;
  if (htmlOpen.test(out)) return out.replace(htmlOpen, (tag) => tag + injection);
  return injection + out;
}

/** Resolves a single CSS reference against the stylesheet URL, leaving absolute/data/fragment refs alone. */
function resolveCssRef(value: string, target: URL): string {
  const trimmed = value.trim();
  if (!trimmed || /^(data:|https?:|\/\/|#|about:)/i.test(trimmed)) return value;
  try {
    return new URL(trimmed, target).toString();
  } catch {
    return value;
  }
}

/**
 * Rewrites relative `url(...)` and bare `@import "…"` targets in a stylesheet to absolute URLs
 * resolved against its own URL, so a downloaded CSS still finds its fonts/images from disk. The
 * `@import url(...)` form is covered by the `url(...)` pass. `data:`, absolute and fragment refs
 * are left untouched.
 */
export function rewriteCssUrls(css: string, target: URL): string {
  const withUrls = css.replace(/url\(\s*("[^"]*"|'[^']*'|[^"')]+)\s*\)/gi, (full, raw) => {
    const quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : '';
    const value = quote ? raw.slice(1, -1) : raw;
    const resolved = resolveCssRef(value, target);
    return resolved === value ? full : `url(${quote}${resolved}${quote})`;
  });
  return withUrls.replace(/@import\s+("[^"]*"|'[^']*')/gi, (full, raw) => {
    const quote = raw[0];
    const value = raw.slice(1, -1);
    const resolved = resolveCssRef(value, target);
    return resolved === value ? full : `@import ${quote}${resolved}${quote}`;
  });
}

/**
 * Builds the content to download: HTML gets base/charset injection, CSS gets its relative
 * references resolved to absolute; other types are downloaded as-is.
 */
export function buildDownloadContent(code: string, type: FileType, target: URL): string {
  if (type === 'html') return injectBaseAndCharset(code, target);
  if (type === 'css') return rewriteCssUrls(code, target);
  return code;
}

/**
 * Triggers a download of the viewer's content via a transient `<a download>` + object URL — no
 * `downloads` permission needed. The viewer document is on the extension origin (even in the
 * in-place iframe), so the suggested filename is honored on Chrome and Firefox.
 */
export function downloadSource(code: string, type: FileType, target: URL, contentDisposition?: string | null): void {
  const content = buildDownloadContent(code, type, target);
  const filename = deriveFilename(target, type, contentDisposition);

  const url = URL.createObjectURL(new Blob([content], { type: MIME[type] }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  // Defer cleanup so the browser has kicked off the download before the object URL is revoked.
  setTimeout(() => {
    anchor.remove();
    URL.revokeObjectURL(url);
  }, 0);
}
