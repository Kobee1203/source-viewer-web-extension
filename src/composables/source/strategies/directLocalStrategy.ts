import { browser } from 'wxt/browser';
import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { mimeToFileType } from '@/utils/contentType';
import { t } from '@/utils/i18n';
import { requestSessionSource } from '@/utils/messaging';

/**
 * Strategy: Directly fetches `file:///` URLs from the standalone extension tab
 * using the standard Fetch API, prioritizing captured tab session source if available.
 */
export const directLocalStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'url') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  try {
    const sessionRes = await requestSessionSource();
    if (sessionRes.source) {
      return {
        rawText: sessionRes.source.text,
        byteSize: sessionRes.source.byteSize,
        targetUrl: target.url,
        isDomFallback: sessionRes.source.isDomFallback,
        isSourceTabClosed: sessionRes.sourceTabClosed,
        isLocalSnapshot: true,
        snapshotTimestamp: sessionRes.source.timestamp,
        detectedFileType: sessionRes.source.contentType
          ? (mimeToFileType(sessionRes.source.contentType) ?? undefined)
          : undefined,
      };
    }
  } catch {
    // Proceed to direct fetch if session check fails
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
