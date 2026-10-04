import { mockBrowser } from '@@/tests/setup';
import { describe, expect, it, vi } from 'vitest';
import { directLocalStrategy } from '@/composables/source/strategies/directLocalStrategy';

describe('directLocalStrategy', () => {
  it('returns raw payload when window.fetch succeeds on file URL', async () => {
    const mockResponse = {
      ok: true,
      text: () => Promise.resolve('console.log("local file");'),
    };
    vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const targetUrl = new URL('file:///path/to/script.js');
    const result = await directLocalStrategy({
      kind: 'url',
      url: targetUrl,
    });

    expect(result.rawText).toBe('console.log("local file");');
    expect(result.byteSize).toBe(26);
    expect(result.targetUrl).toBe(targetUrl);
  });

  it('throws file-access-denied SourceFetchError when fetch fails and isAllowedFileSchemeAccess is false', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new Error('Failed to fetch'));
    mockBrowser.extension.isAllowedFileSchemeAccess.mockResolvedValue(false);

    await expect(
      directLocalStrategy({
        kind: 'url',
        url: new URL('file:///path/to/script.js'),
      }),
    ).rejects.toMatchObject({
      kind: 'file-access-denied',
    });
  });

  it('throws file-access-denied SourceFetchError when fetch fails even if isAllowedFileSchemeAccess is true', async () => {
    vi.spyOn(window, 'fetch').mockRejectedValue(new TypeError('NetworkError when attempting to fetch resource.'));
    mockBrowser.extension.isAllowedFileSchemeAccess.mockResolvedValue(true);

    await expect(
      directLocalStrategy({
        kind: 'url',
        url: new URL('file:///path/to/script.js'),
      }),
    ).rejects.toMatchObject({
      kind: 'file-access-denied',
    });
  });

  it('prioritizes captured session source over window.fetch when available', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      source: {
        text: '<h1>Session Source</h1>',
        byteSize: 23,
        isDomFallback: false,
        contentType: 'text/html',
        timestamp: 123456789,
      },
      sourceTabClosed: false,
    });

    const targetUrl = new URL('file:///path/to/sample.html');
    const result = await directLocalStrategy({
      kind: 'url',
      url: targetUrl,
    });

    expect(result.rawText).toBe('<h1>Session Source</h1>');
    expect(result.byteSize).toBe(23);
    expect(result.isDomFallback).toBe(false);
    expect(result.isLocalSnapshot).toBe(true);
    expect(result.snapshotTimestamp).toBe(123456789);
    expect(result.targetUrl).toBe(targetUrl);
  });

  it('bypasses captured session source when its URL does not match target URL', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      source: {
        url: 'file:///path/to/sample.html',
        text: '<h1>Sample HTML</h1>',
        byteSize: 20,
        isDomFallback: false,
        contentType: 'text/html',
        timestamp: 123456789,
      },
      sourceTabClosed: false,
    });

    const mockResponse = {
      ok: true,
      text: () => Promise.resolve('console.log("app.js");'),
    };
    vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const targetUrl = new URL('file:///path/to/app.js');
    const result = await directLocalStrategy({
      kind: 'url',
      url: targetUrl,
    });

    expect(result.rawText).toBe('console.log("app.js");');
    expect(result.byteSize).toBe(22);
    expect(result.isLocalSnapshot).toBeUndefined();
    expect(result.targetUrl).toBe(targetUrl);
  });
});
