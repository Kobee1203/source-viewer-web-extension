import { mockBrowser } from '@@/tests/setup';
import { describe, expect, it } from 'vitest';
import { remoteFetchStrategy } from '@/composables/source/strategies/remoteFetchStrategy';
import { SourceFetchError } from '@/composables/source/types';

describe('remoteFetchStrategy', () => {
  it('returns raw payload when background fetch succeeds', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: true,
      text: 'const x = 42;',
      contentType: 'application/javascript',
      contentDisposition: null,
      byteLength: 13,
      httpStatus: 200,
      httpStatusText: 'OK',
    });

    const targetUrl = new URL('https://example.com/script.js');
    const result = await remoteFetchStrategy({
      kind: 'url',
      url: targetUrl,
    });

    expect(result.rawText).toBe('const x = 42;');
    expect(result.byteSize).toBe(13);
    expect(result.mimeType).toBe('application/javascript');
    expect(result.httpStatus).toBe(200);
    expect(result.targetUrl).toBe(targetUrl);
  });

  it('throws SourceFetchError when background fetch returns error', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: false,
      error: '404 Not Found',
    });

    await expect(
      remoteFetchStrategy({
        kind: 'url',
        url: new URL('https://example.com/missing.js'),
      }),
    ).rejects.toThrowError(SourceFetchError);
  });
});
