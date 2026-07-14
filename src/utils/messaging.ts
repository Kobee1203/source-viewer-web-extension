import { browser } from 'wxt/browser';

/** Request sent from the viewer to the background service worker to fetch a page's source. */
export interface FetchSourceRequest {
  type: 'FETCH_SOURCE';
  url: string;
}

/** Response returned by the background service worker. */
export type FetchSourceResponse =
  | { ok: true; text: string }
  | { ok: false; error: string };

/** Typed wrapper around runtime.sendMessage for the FETCH_SOURCE request. */
export function requestSource(url: string): Promise<FetchSourceResponse> {
  const message: FetchSourceRequest = { type: 'FETCH_SOURCE', url };
  return browser.runtime.sendMessage(message) as Promise<FetchSourceResponse>;
}

/**
 * Handles a FETCH_SOURCE request in the background: fetches the page's source
 * there to avoid the page's own CORS/CSP constraints.
 */
export function fetchSource(
  message: FetchSourceRequest,
): Promise<FetchSourceResponse> {
  return fetch(message.url, {
    headers: { Accept: 'text/html,text/plain,*/*' },
    credentials: 'omit',
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return res.text();
    })
    .then((text): FetchSourceResponse => ({ ok: true, text }))
    .catch((err): FetchSourceResponse => ({ ok: false, error: err.message }));
}
