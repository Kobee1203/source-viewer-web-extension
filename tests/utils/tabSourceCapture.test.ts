import { mockBrowser } from '@@/tests/setup';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { captureTabSource, pageCaptureScript } from '@/utils/tabSourceCapture';

describe('tabSourceCapture', () => {
  describe('captureTabSource', () => {
    it('executes script on target tab and returns the result', async () => {
      const mockResult = {
        text: 'console.log("hello");',
        byteSize: 21,
        isDomFallback: false,
        contentType: 'application/javascript',
      };
      mockBrowser.scripting.executeScript.mockResolvedValue([{ result: mockResult }]);

      const res = await captureTabSource(42);

      expect(mockBrowser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 42 },
        func: pageCaptureScript,
      });
      expect(res).toEqual(mockResult);
    });

    it('returns null when executeScript fails', async () => {
      mockBrowser.scripting.executeScript.mockRejectedValue(new Error('Cannot script restricted tab'));

      const res = await captureTabSource(99);

      expect(res).toBeNull();
    });
  });

  describe('pageCaptureScript', () => {
    const originalFetch = globalThis.fetch;

    beforeEach(() => {
      document.documentElement.innerHTML = '<html><head><title>Test</title></head><body><h1>Hello</h1></body></html>';
    });

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('returns raw text from force-cache fetch when successful', async () => {
      const mockHtml = '<!DOCTYPE html><html><head></head><body>Raw source</body></html>';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/html; charset=utf-8' }),
        arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockHtml).buffer),
        text: () => Promise.resolve(mockHtml),
      });

      const res = await pageCaptureScript();

      expect(res.isDomFallback).toBe(false);
      expect(res.text).toBe(mockHtml);
      expect(res.byteSize).toBe(new Blob([mockHtml]).size);
    });

    it('falls back to DOM extraction when fetch fails on HTML document', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('NetworkError'));

      const res = await pageCaptureScript();

      expect(res.isDomFallback).toBe(true);
      expect(res.text).toContain('<h1>Hello</h1>');
      expect(res.contentType).toBe('text/html');
    });

    it('falls back to <pre> content for non-HTML raw source document', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('NetworkError'));
      document.documentElement.innerHTML = '<body><pre>const x = 10;</pre></body>';
      Object.defineProperty(document, 'contentType', { value: 'application/javascript', configurable: true });

      const res = await pageCaptureScript();

      expect(res.isDomFallback).toBe(true);
      expect(res.text).toBe('const x = 10;');
    });
  });
});
