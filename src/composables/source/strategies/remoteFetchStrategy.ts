import { browser } from 'wxt/browser';
import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { t } from '@/utils/i18n';
import { requestSource } from '@/utils/messaging';

/**
 * Strategy: Fetches remote HTTP/HTTPS (or fallthrough) source code
 * through the background service worker via `FETCH_SOURCE`.
 */
export const remoteFetchStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'url') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  const response = await requestSource(target.url.toString());

  if (!response.ok) {
    if (target.url.protocol === 'file:') {
      const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
      if (!isAllowed) {
        throw new SourceFetchError('file-access-denied', t('fileSchemePermissionHelp'));
      }
    }
    throw new SourceFetchError('network', t('errorLoadSource', [response.error || t('errorUnknown')]), true);
  }

  return {
    rawText: response.text,
    byteSize: response.byteLength,
    mimeType: response.contentType,
    contentDisposition: response.contentDisposition,
    httpStatus: response.httpStatus,
    httpStatusText: response.httpStatusText,
    targetUrl: target.url,
  };
};
