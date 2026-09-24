import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchHostSource } from '@/utils/fetchHostSource';

describe('fetchHostSource', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns parsed text and metadata when force-cache fetch succeeds', async () => {
    const mockContent = 'function test() { return true; }';
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/javascript; charset=utf-8' }),
      arrayBuffer: () => Promise.resolve(new TextEncoder().encode(mockContent).buffer),
      text: () => Promise.resolve(mockContent),
    });

    const result = await fetchHostSource();

    expect(result).not.toBeNull();
    expect(result?.text).toBe(mockContent);
    expect(result?.contentType).toContain('application/javascript');
    expect(result?.characterSet).toBe('utf-8');
    expect(result?.byteSize).toBe(new Blob([mockContent]).size);
  });

  it('returns null when fetch throws or rejects', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('NetworkError'));

    const result = await fetchHostSource();

    expect(result).toBeNull();
  });

  it('returns null when fetch response is not ok', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    const result = await fetchHostSource();

    expect(result).toBeNull();
  });
});
