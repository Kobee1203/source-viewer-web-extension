export const DEFAULT_FILE_TYPE = 'html';

/** The kind of source we highlight, mapped to a Prism language. */
export type FileType = typeof DEFAULT_FILE_TYPE | 'javascript' | 'css' | 'xml' | 'json';

/** Maps a URL's file extension to a FileType, or null when it isn't a handled source extension. */
export function extensionToFileType(url: URL): FileType | null {
  const pathname = url.pathname.toLowerCase();
  if (pathname.endsWith('.js') || pathname.endsWith('.mjs') || pathname.endsWith('.cjs')) return 'javascript';
  if (pathname.endsWith('.css')) return 'css';
  if (pathname.endsWith('.json')) return 'json';
  if (pathname.endsWith('.xml')) return 'xml';
  return null;
}

/** Determines the file type from a URL's extension (defaults to DEFAULT_FILE_TYPE). */
export function getFileType(url: URL): FileType {
  return extensionToFileType(url) ?? DEFAULT_FILE_TYPE;
}
