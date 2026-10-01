import { browser } from 'wxt/browser';
import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { formatFromUrl } from '@/composables/useFontLoad';
import { t } from '@/utils/i18n';
import { isRestricted } from '@/utils/restricted';

/**
 * Strategy: Fetches a font file from a remote HTTP(S) or local file:/// URL
 * and decodes it into an ArrayBuffer for FontFace preview.
 */
export const fontFetchStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'url') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  if (isRestricted(target.url)) {
    throw new SourceFetchError('restricted', t('errorRestricted'), true);
  }

  if (target.url.protocol === 'file:') {
    const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
    if (!isAllowed) {
      throw new SourceFetchError('file-access-denied', t('fileSchemePermissionHelp'));
    }
  }

  try {
    const res = await fetch(target.url.toString());
    if (!res.ok) {
      throw new SourceFetchError('network', t('errorLoadSource', [`HTTP ${res.status} ${res.statusText}`]), true);
    }
    const buffer = await res.arrayBuffer();
    const fileName = target.url.pathname.split('/').filter(Boolean).pop() || null;

    return {
      rawText: '',
      byteSize: buffer.byteLength,
      targetUrl: target.url,
      fileName,
      resourceType: 'font',
      fontBuffer: buffer,
      fontFormat: formatFromUrl(target.url),
      httpStatus: res.status,
      httpStatusText: res.statusText,
    };
  } catch (err) {
    if (err instanceof SourceFetchError) throw err;
    if (target.url.protocol === 'file:') {
      throw new SourceFetchError('file-access-denied', t('fileSchemePermissionHelp'));
    }
    throw new SourceFetchError('network', t('errorLoadSource', [(err as Error).message || t('errorUnknown')]), true);
  }
};
