import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { formatFromUrl } from '@/composables/useFontLoad';
import { getStoredSnapshot } from '@/composables/useLocalFile';
import { t } from '@/utils/i18n';

/**
 * Strategy: Restores an in-memory snapshot saved to `sessionStorage`
 * from a previous drag-and-drop or local file pick session.
 */
export const sessionSnapshotStrategy: SourceFetchStrategy = async () => {
  const stored = getStoredSnapshot();
  if (!stored) {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  if (stored.fileType === 'font') {
    const res = await fetch(stored.text);
    const buffer = await res.arrayBuffer();
    return {
      rawText: '',
      byteSize: buffer.byteLength,
      fileName: stored.name,
      isLocalSnapshot: true,
      snapshotTimestamp: stored.timestamp,
      resourceType: 'font',
      fontBuffer: buffer,
      fontFormat: stored.fontFormat || formatFromUrl(stored.name),
    };
  }

  return {
    rawText: stored.text,
    byteSize: new Blob([stored.text]).size,
    fileName: stored.name,
    isLocalSnapshot: true,
    snapshotTimestamp: stored.timestamp,
    detectedFileType: stored.fileType,
    resourceType: 'code',
  };
};
