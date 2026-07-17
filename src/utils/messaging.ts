import { browser } from 'wxt/browser';

/** Request sent from the viewer to the background service worker to fetch a page's source. */
export interface FetchSourceRequest {
  type: 'FETCH_SOURCE';
  url: string;
}

/** Response returned by the background service worker. `contentType` is the raw response header, if any. */
export type FetchSourceResponse = { ok: true; text: string; contentType: string | null } | { ok: false; error: string };

/** Typed wrapper around runtime.sendMessage for the FETCH_SOURCE request. */
export function requestSource(url: string): Promise<FetchSourceResponse> {
  const message: FetchSourceRequest = { type: 'FETCH_SOURCE', url };
  return browser.runtime.sendMessage(message);
}

/** Request sent from the content script asking the background to open a direct-content URL in the viewer. */
export interface AutoOpenRequest {
  type: 'AUTO_OPEN';
  url: string;
}

/** Asks the background to redirect the current tab to the viewer for `url`. Fire-and-forget. */
export function requestAutoOpen(url: string): Promise<void> {
  const message: AutoOpenRequest = { type: 'AUTO_OPEN', url };
  return browser.runtime.sendMessage(message);
}

/**
 * Handles a FETCH_SOURCE request in the background: fetches the page's source
 * there to avoid the page's own CORS/CSP constraints.
 */
export async function fetchSource(message: FetchSourceRequest): Promise<FetchSourceResponse> {
  try {
    const res = await fetch(message.url, {
      headers: { Accept: 'text/html,text/plain,*/*' },
      credentials: 'omit',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const text = await res.text();
    return { ok: true, text, contentType: res.headers.get('content-type') };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
