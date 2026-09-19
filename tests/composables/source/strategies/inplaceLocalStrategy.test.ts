import { describe, expect, it } from 'vitest';
import { inplaceLocalStrategy } from '@/composables/source/strategies/inplaceLocalStrategy';
import { SourceFetchError } from '@/composables/source/types';

describe('inplaceLocalStrategy', () => {
  it('extracts host source text when parent responds to message', async () => {
    const onParentMessage = (event: MessageEvent) => {
      if (
        typeof event.data === 'object' &&
        event.data !== null &&
        (event.data as { type?: unknown }).type === 'REQUEST_INPLACE_LOCAL_SOURCE'
      ) {
        window.postMessage({ type: 'INPLACE_LOCAL_SOURCE_DATA', text: 'const inplace = true;' }, '*');
      }
    };

    window.addEventListener('message', onParentMessage);

    try {
      const targetUrl = new URL('file:///path/to/inplace.js');
      const result = await inplaceLocalStrategy({
        kind: 'url',
        url: targetUrl,
      });

      expect(result.rawText).toBe('const inplace = true;');
      expect(result.byteSize).toBe(21);
      expect(result.targetUrl).toBe(targetUrl);
    } finally {
      window.removeEventListener('message', onParentMessage);
    }
  });

  it('throws SourceFetchError when parent does not respond in time', async () => {
    await expect(
      inplaceLocalStrategy({
        kind: 'url',
        url: new URL('file:///path/to/timeout.js'),
      }),
    ).rejects.toThrowError(SourceFetchError);
  }, 1000);
});
