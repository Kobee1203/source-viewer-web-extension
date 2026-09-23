import { browser } from 'wxt/browser';

type MessageSender = Parameters<Parameters<typeof browser.runtime.onMessage.addListener>[0]>[1];

export interface TabSourceCaptureResult {
  text: string;
  byteSize: number;
  isDomFallback: boolean;
  contentType?: string;
  characterSet?: string;
}

export interface TabSourceCapturedMessage {
  type: 'TAB_SOURCE_CAPTURED';
  result: TabSourceCaptureResult;
}

/**
 * Injects `/content-scripts/tab-capture.js` inside a target browser tab
 * and waits for the captured source payload via runtime messaging.
 * Returns null if the tab cannot be scripted or times out.
 */
export async function captureTabSource(tabId: number): Promise<TabSourceCaptureResult | null> {
  try {
    const capturePromise = new Promise<TabSourceCaptureResult | null>((resolve) => {
      let settled = false;

      const timeoutId = setTimeout(() => {
        if (!settled) {
          settled = true;
          browser.runtime.onMessage.removeListener(onMessage);
          resolve(null);
        }
      }, 2000);

      const onMessage = (message: unknown, sender: MessageSender) => {
        if (
          typeof message === 'object' &&
          message !== null &&
          (message as { type?: unknown }).type === 'TAB_SOURCE_CAPTURED' &&
          sender.tab?.id === tabId
        ) {
          if (!settled) {
            settled = true;
            clearTimeout(timeoutId);
            browser.runtime.onMessage.removeListener(onMessage);
            resolve((message as TabSourceCapturedMessage).result);
          }
        }
      };

      browser.runtime.onMessage.addListener(onMessage);
    });

    await browser.scripting.executeScript({
      target: { tabId },
      files: ['/content-scripts/tab-capture.js'],
    });

    return await capturePromise;
  } catch (err) {
    console.warn(`Could not script tab ${tabId} for source capture:`, err);
    return null;
  }
}
