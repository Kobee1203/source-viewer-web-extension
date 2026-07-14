/** The kind of source we highlight, mapped to a Prism language. */
export type FileType = 'javascript' | 'css' | 'markup';

/** Determines the file type from a URL's extension (defaults to markup). */
export function getFileType(url: URL): FileType {
  try {
    const pathname = url.pathname.toLowerCase();
    if (pathname.endsWith('.js') || pathname.endsWith('.mjs'))
      return 'javascript';
    if (pathname.endsWith('.css')) return 'css';
    return 'markup';
  } catch {
    return 'markup';
  }
}
