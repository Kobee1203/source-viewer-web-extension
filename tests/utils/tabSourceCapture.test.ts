import { mockBrowser } from '@@/tests/setup';
import { describe, expect, it, vi } from 'vitest';
import { captureTabSource } from '@/utils/tabSourceCapture';

describe('tabSourceCapture', () => {
  describe('captureTabSource', () => {
    it('executes tab-capture.js on target tab and resolves when message is received', async () => {
      const mockResult = {
        text: 'console.log("hello");',
        byteSize: 21,
        isDomFallback: false,
        contentType: 'application/javascript',
      };

      let listenerCallback: ((msg: unknown, sender: unknown) => void) | null = null;
      mockBrowser.runtime.onMessage.addListener.mockImplementation((cb: (msg: unknown, sender: unknown) => void) => {
        listenerCallback = cb;
      });

      mockBrowser.scripting.executeScript.mockImplementation(() => {
        if (listenerCallback) {
          listenerCallback({ type: 'TAB_SOURCE_CAPTURED', result: mockResult }, { tab: { id: 42 } });
        }
        return Promise.resolve([]);
      });

      const res = await captureTabSource(42);

      expect(mockBrowser.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 42 },
        files: ['/content-scripts/tab-capture.js'],
      });
      expect(res).toEqual(mockResult);
    });

    it('returns null when executeScript fails', async () => {
      mockBrowser.scripting.executeScript.mockRejectedValue(new Error('Cannot script restricted tab'));

      const res = await captureTabSource(99);

      expect(res).toBeNull();
    });

    it('returns null when capture times out', async () => {
      vi.useFakeTimers();
      try {
        mockBrowser.scripting.executeScript.mockResolvedValue([]);

        const capturePromise = captureTabSource(100);
        vi.advanceTimersByTime(2000);

        const res = await capturePromise;
        expect(res).toBeNull();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
