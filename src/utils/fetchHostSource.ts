export interface FetchHostSourceResult {
  text: string;
  byteSize: number;
  contentType: string;
  characterSet: string;
}

/**
 * Attempts a same-origin `force-cache` fetch of `location.href` to retrieve the
 * original, unmutated raw source file from the browser cache/disk.
 *
 * This bypasses client-side DOM alterations made by JavaScript, and bypasses
 * Firefox cross-origin restrictions on `file:///` by running in the page's own origin.
 * Returns null if the fetch fails or is rejected.
 */
export async function fetchHostSource(): Promise<FetchHostSourceResult | null> {
  try {
    const response = await fetch(location.href, {
      method: 'GET',
      cache: 'force-cache',
      redirect: 'error',
      referrerPolicy: 'same-origin',
    });

    if (response.ok || (location.protocol === 'file:' && (response.status === 0 || response.status === 200))) {
      const contentType = response.headers.get('content-type') || document.contentType || '';
      const charsetMatch = contentType.match(/;\s*charset=\s*([^\s;]+)/i);
      const characterSet = charsetMatch ? charsetMatch[1] : document.characterSet || 'utf-8';

      let text = '';
      try {
        const buffer = await response.arrayBuffer();
        const decoder = new TextDecoder(characterSet);
        text = decoder.decode(buffer);
      } catch {
        text = await response.text();
      }

      if (text.length > 0) {
        return {
          text,
          byteSize: new Blob([text]).size,
          contentType,
          characterSet,
        };
      }
    }
  } catch {
    // Return null on any fetch error to allow caller to fall back gracefully
  }

  return null;
}
