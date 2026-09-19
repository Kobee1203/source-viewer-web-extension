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

  const rawText = await new Promise<string | null>((resolve) => {
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
        resolve(typeof text === 'string' ? text : '');
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

  if (rawText === null) {
    throw new SourceFetchError('generic', t('errorLoadSource', [t('errorUnknown')]));
  }

  return {
    rawText,
    byteSize: new Blob([rawText]).size,
    targetUrl: target.url,
  };
};
