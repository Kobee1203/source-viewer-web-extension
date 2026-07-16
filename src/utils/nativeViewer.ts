import { browser } from 'wxt/browser';

/** Request sent from the viewer to open a target URL in the browser's native view-source viewer. */
export interface OpenNativeRequest {
  type: 'OPEN_NATIVE';
  url: string;
  newTab: boolean;
}

/** Response returned by the background service worker for an OPEN_NATIVE request. */
export type OpenNativeResponse = { ok: true } | { ok: false; error: string };

/**
 * Asks the background to open `target` in the browser's native `view-source:`
 * viewer, in the current tab or a new one. See {@link NativeViewerController}.
 */
export function openNativeViewer(target: URL, newTab: boolean): Promise<OpenNativeResponse> {
  const message: OpenNativeRequest = {
    type: 'OPEN_NATIVE',
    url: target.toString(),
    newTab,
  };
  return browser.runtime.sendMessage(message);
}

/**
 * Background-side controller for the native view-source viewer.
 *
 * Tracks the tabs the user explicitly sent to the native viewer (keyed by tab
 * id) so the background's `view-source:` interception lets those navigations
 * through — including across server redirects that would strip a URL-based
 * marker (e.g. wikipedia.org 301s `/?x` back to `/`). State is encapsulated in
 * a private Set; create one instance in the background and share it across the
 * message and tab-update listeners.
 */
export interface NativeViewerController {
  /** Opens `message.url` in the native viewer, remembering the tab so it isn't recaptured. */
  open(message: OpenNativeRequest, senderTabId: number | undefined): Promise<OpenNativeResponse>;
  /** Whether the given tab was sent to the native viewer and shouldn't be recaptured. */
  isAllowed(tabId: number): boolean;
  /** Ends a tab's one-shot allowance (call once its load completes). */
  forget(tabId: number): void;
}

export function createNativeViewerController(): NativeViewerController {
  const allowed = new Set<number>();

  return {
    async open(message, senderTabId) {
      const viewSourceUrl = 'view-source:' + message.url;
      let tabId = senderTabId;
      try {
        if (message.newTab) {
          // Create the tab blank first so its id is registered before it starts
          // loading the view-source: URL (otherwise onUpdated could race us).
          const tab = await browser.tabs.create({ active: true });
          tabId = tab.id;
        }
        if (tabId === undefined) return { ok: false, error: 'no target tab' };

        allowed.add(tabId);
        await browser.tabs.update(tabId, { url: viewSourceUrl });
        return { ok: true };
      } catch (err) {
        if (tabId !== undefined) allowed.delete(tabId);
        return { ok: false, error: (err as Error).message };
      }
    },
    isAllowed: (tabId) => allowed.has(tabId),
    forget: (tabId) => {
      allowed.delete(tabId);
    },
  };
}
