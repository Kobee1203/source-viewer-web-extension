import { browser } from 'wxt/browser';
import { fetchHostSource } from '@/utils/fetchHostSource';
import { isHtmlDocument } from '@/utils/fileType';
import { extractHostSource } from '@/utils/hostSource';

export interface TabSourceCaptureResult {
  text: string;
  byteSize: number;
  isDomFallback: boolean;
  contentType?: string;
  characterSet?: string;
}

/**
 * Self-contained function injected into a page via `browser.scripting.executeScript`
 * or executed directly in content scripts.
 *
 * It first attempts a same-origin `force-cache` fetch via `fetchHostSource` to retrieve the
 * original, unmutated raw source file from browser cache/disk (bypassing DOM alterations
 * made by client-side JavaScript, and bypassing Firefox cross-origin restrictions on `file:///`).
 *
 * If the fetch fails (or is not applicable), it cleanly falls back to extracting the DOM
 * or `<pre>` text content using `extractHostSource`.
 */
export async function pageCaptureScript(): Promise<TabSourceCaptureResult> {
  // 1. Try same-origin force-cache fetch for raw unmutated source
  const fetched = await fetchHostSource();
  if (fetched) {
    return {
      text: fetched.text,
      byteSize: fetched.byteSize,
      isDomFallback: false,
      contentType: fetched.contentType,
      characterSet: fetched.characterSet,
    };
  }

  // 2. Fallback: Host DOM extraction using unified extractHostSource
  const isHtml = isHtmlDocument(location.pathname, document.contentType);
  const text = extractHostSource();

  return {
    text,
    byteSize: new Blob([text]).size,
    isDomFallback: true,
    contentType: isHtml ? 'text/html' : document.contentType,
    characterSet: document.characterSet,
  };
}

/**
 * Injects and executes `pageCaptureScript` inside a target browser tab.
 * Returns null if the tab cannot be scripted (e.g. restricted URLs or closed tabs).
 */
export async function captureTabSource(tabId: number): Promise<TabSourceCaptureResult | null> {
  try {
    const results = await browser.scripting.executeScript({
      target: { tabId },
      func: pageCaptureScript,
    });
    return (results?.[0]?.result as TabSourceCaptureResult) ?? null;
  } catch (err) {
    console.warn(`Could not script tab ${tabId} for source capture:`, err);
    return null;
  }
}
