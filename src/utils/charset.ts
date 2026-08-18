/**
 * Charset detection for fetched source (see `fetchSource` in `messaging.ts`).
 *
 * `res.text()` decodes using the charset from the HTTP `Content-Type` **header** and silently
 * defaults to UTF-8 when the header carries no parseable charset — it never consults the HTML
 * `<meta>`. Legacy-encoded pages (e.g. iso-8859-1) then get corrupted to U+FFFD (`�`) before the
 * viewer ever sees them, unrecoverably. We instead read the raw bytes and pick the charset
 * ourselves: HTTP header → HTML `<meta>` → UTF-8.
 */

/** Number of leading bytes scanned for a `<meta>` charset declaration. */
const META_SNIFF_BYTES = 1024;

/**
 * Extracts a charset label from a `Content-Type` header value. Tolerant of the malformed
 * `text/html, charset=…` (comma instead of semicolon) seen in the wild (e.g. developpez.com),
 * which the strict MIME parser behind `res.text()` ignores. Returns `null` when there is none.
 */
export function charsetFromContentType(contentType: string | null | undefined): string | null {
  if (!contentType) return null;
  const match = /charset=["']?([^"';,\s]+)/i.exec(contentType);
  return match ? match[1] : null;
}

/**
 * Sniffs a charset from an HTML `<meta>` declaration, covering both `<meta charset="X">` and
 * `<meta http-equiv="content-type" content="…; charset=X">`. Returns `null` when none is found.
 * Only HTML declares a charset this way, so it is safe to attempt on any text response.
 */
export function charsetFromHtmlMeta(head: string): string | null {
  const match = /<meta[^>]+charset=["']?([^"'>;,\s]+)/i.exec(head);
  return match ? match[1] : null;
}

/**
 * Decodes raw response bytes to a string, choosing the charset by: HTTP `Content-Type` header →
 * HTML `<meta>` in the first {@link META_SNIFF_BYTES} bytes → UTF-8. Falls back to UTF-8 if the
 * detected label is unknown to `TextDecoder` (which throws on unsupported labels).
 */
export function decodeBytes(bytes: ArrayBuffer, contentType: string | null | undefined): string {
  let label = charsetFromContentType(contentType);
  if (!label) {
    // Read the head as latin1 (1 byte → 1 code point) so the ASCII markup is intact to scan.
    const head = new TextDecoder('latin1').decode(bytes.slice(0, META_SNIFF_BYTES));
    label = charsetFromHtmlMeta(head);
  }
  try {
    return new TextDecoder(label ?? 'utf-8').decode(bytes);
  } catch {
    return new TextDecoder('utf-8').decode(bytes);
  }
}
