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
