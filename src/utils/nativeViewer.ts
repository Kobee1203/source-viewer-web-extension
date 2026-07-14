import { browser } from 'wxt/browser';

/** Request sent from the viewer to open a target URL in the browser's native view-source viewer. */
export interface OpenNativeRequest {
  type: 'OPEN_NATIVE';
  url: string;
  newTab: boolean;
}

/** Response returned by the background service worker for an OPEN_NATIVE request. */
export type OpenNativeResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Asks the background to open `target` in the browser's native `view-source:`
 * viewer, in the current tab or a new one.
 *
 * The background tracks the request in memory (keyed by tab id) so its own
 * `view-source:` interception lets this navigation through — including across
 * server redirects that would strip a URL-based marker (e.g. wikipedia.org).
 */
export function openNativeViewer(
  target: URL,
  newTab: boolean,
): Promise<OpenNativeResponse> {
  const message: OpenNativeRequest = {
    type: 'OPEN_NATIVE',
    url: target.toString(),
    newTab,
  };
  return browser.runtime.sendMessage(message) as Promise<OpenNativeResponse>;
}
