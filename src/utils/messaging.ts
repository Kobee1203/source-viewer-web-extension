import { browser } from 'wxt/browser';

/** Request sent from the viewer to the background service worker to fetch a page's source. */
export interface FetchSourceRequest {
  type: 'FETCH_SOURCE';
  url: string;
}

/** Response returned by the background service worker. */
export type FetchSourceResponse = { ok: true; text: string } | { ok: false; error: string };

/** Typed wrapper around runtime.sendMessage for the FETCH_SOURCE request. */
export function requestSource(url: string): Promise<FetchSourceResponse> {
  const message: FetchSourceRequest = { type: 'FETCH_SOURCE', url };
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
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
