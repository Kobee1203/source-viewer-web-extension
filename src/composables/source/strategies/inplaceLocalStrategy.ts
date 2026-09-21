import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { t } from '@/utils/i18n';

/**
 * Strategy: Requests the in-place host DOM text from `inplace-viewer.content.ts`
 * via `window.parent.postMessage` when embedded inside an iframe.
 */
export const inplaceLocalStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'url') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  const result = await new Promise<{
    text: string;
    isDomFallback?: boolean;
    byteSize?: number;
  } | null>((resolve) => {
    let resolved = false;
    const handler = (event: MessageEvent) => {
      if (
        typeof event.data === 'object' &&
        event.data !== null &&
        (event.data as { type?: unknown }).type === 'INPLACE_LOCAL_SOURCE_DATA'
      ) {
        window.removeEventListener('message', handler);
        resolved = true;
        const text = (event.data as { text?: unknown }).text;
        const isDomFallback = (event.data as { isDomFallback?: unknown }).isDomFallback;
        const byteSize = (event.data as { byteSize?: unknown }).byteSize;
        resolve({
          text: typeof text === 'string' ? text : '',
          isDomFallback: typeof isDomFallback === 'boolean' ? isDomFallback : false,
          byteSize: typeof byteSize === 'number' ? byteSize : undefined,
        });
      }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'REQUEST_INPLACE_LOCAL_SOURCE' }, '*');

    setTimeout(() => {
      if (!resolved) {
        window.removeEventListener('message', handler);
        resolve(null);
      }
    }, 500);
  });

  if (result === null) {
    throw new SourceFetchError('generic', t('errorLoadSource', [t('errorUnknown')]));
  }

  return {
    rawText: result.text,
    byteSize: result.byteSize ?? new Blob([result.text]).size,
    targetUrl: target.url,
    isDomFallback: result.isDomFallback,
  };
};
