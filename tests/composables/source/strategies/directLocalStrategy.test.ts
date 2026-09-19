import { mockBrowser } from '@@/tests/setup';
import { describe, expect, it, vi } from 'vitest';
import { directLocalStrategy } from '@/composables/source/strategies/directLocalStrategy';

describe('directLocalStrategy', () => {
  it('returns raw payload when window.fetch succeeds on file URL', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve('console.log("local file");'),
    };
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockResolvedValue(mockResponse);

    try {
      const targetUrl = new URL('file:///path/to/script.js');
      const result = await directLocalStrategy({
        kind: 'url',
        url: targetUrl,
      });

      expect(result.rawText).toBe('console.log("local file");');
      expect(result.byteSize).toBe(26);
      expect(result.targetUrl).toBe(targetUrl);
    } finally {
      window.fetch = originalFetch;
    }
  });

  it('throws file-access-denied SourceFetchError when fetch fails and isAllowedFileSchemeAccess is false', async () => {
    const originalFetch = window.fetch;
    window.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    mockBrowser.extension.isAllowedFileSchemeAccess.mockResolvedValue(false);

    try {
      await expect(
        directLocalStrategy({
          kind: 'url',
          url: new URL('file:///path/to/script.js'),
        }),
      ).rejects.toMatchObject({
        kind: 'file-access-denied',
      });
    } finally {
      window.fetch = originalFetch;
    }
  });
});
