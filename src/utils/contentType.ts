import { extensionToFileType, type FileType } from '@/utils/fileType';

// Specific source MIME types we recognise. Suffix families (+json, +xml) are handled below.
const CSS_MIMES = new Set(['text/css']);
const JS_MIMES = new Set([
  'text/javascript',
  'application/javascript',
  'application/x-javascript',
  'application/ecmascript',
  'text/ecmascript',
]);
const JSON_MIMES = new Set(['application/json', 'text/json']);
const XML_MIMES = new Set(['text/xml', 'application/xml']);

// Generic MIME types that carry no real hint: fall back to the URL extension.
const GENERIC_MIMES = new Set(['', 'text/plain', 'application/octet-stream']);

/** Extracts the lowercased MIME essence (drops `; charset=…` and casing). */
function essence(mime: string | null | undefined): string {
  return (mime ?? '').split(';')[0].trim().toLowerCase();
}

/**
 * Maps a specific source MIME type to a {@link FileType}, or `null` when it is
 * not a source type we handle (including `text/html` and `image/svg+xml`).
 */
export function mimeToFileType(mime: string | null | undefined): FileType | null {
  const m = essence(mime);
  if (CSS_MIMES.has(m)) return 'css';
  if (JS_MIMES.has(m)) return 'javascript';
  if (JSON_MIMES.has(m) || (m.startsWith('application/') && m.endsWith('+json'))) return 'json';
  if (m === 'image/svg+xml') return null; // an image, not source — leave it to the browser
  if (XML_MIMES.has(m) || (m.startsWith('application/') && m.endsWith('+xml'))) return 'xml';
  return null;
}

/**
 * Decides whether a direct navigation should open in the viewer, and as which
 * {@link FileType}. Uses the response MIME first; for generic MIME types
 * (`text/plain`, `application/octet-stream`) it falls back to the URL extension
 * — this catches e.g. GitHub raw, which serves `.json` as `text/plain`.
 */
export function detectRedirectFileType(mime: string | null | undefined, url: URL): FileType | null {
  const byMime = mimeToFileType(mime);
  if (byMime) return byMime;
  if (GENERIC_MIMES.has(essence(mime))) return extensionToFileType(url);
  return null;
}
