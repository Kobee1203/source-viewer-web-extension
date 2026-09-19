import { browser } from 'wxt/browser';
import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { t } from '@/utils/i18n';

/**
 * Strategy: Directly fetches `file:///` URLs from the standalone extension tab
 * using the standard Fetch API.
 */
export const directLocalStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'url') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  try {
    const res = await fetch(target.url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const rawText = await res.text();

    return {
      rawText,
      byteSize: new Blob([rawText]).size,
      targetUrl: target.url,
    };
  } catch (err) {
    const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
    if (!isAllowed) {
      throw new SourceFetchError('file-access-denied', t('fileSchemePermissionHelp'));
    }
    throw new SourceFetchError('generic', (err as Error).message);
  }
};
