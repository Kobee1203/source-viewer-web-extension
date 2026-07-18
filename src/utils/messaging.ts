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

/** Request sent from `content.ts` asking the background to inject the in-place viewer for `url`. */
export interface RequestViewerInjectionRequest {
  type: 'REQUEST_VIEWER_INJECTION';
  url: string;
}

/** Whether the background went ahead and injected the viewer script into the tab. */
export interface RequestViewerInjectionResponse {
  inject: boolean;
}

/**
 * Asks the background to inject the heavy in-place viewer content script into the
 * current tab. Resolves to `{ inject: false }` (never rejects on the happy path)
 * when the URL is restricted or the tab is gone — the caller must reveal the raw
 * page itself in that case.
 */
export function requestViewerInjection(url: string): Promise<RequestViewerInjectionResponse> {
  const message: RequestViewerInjectionRequest = { type: 'REQUEST_VIEWER_INJECTION', url };
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
