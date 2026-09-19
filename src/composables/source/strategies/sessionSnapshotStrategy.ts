import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { getStoredSnapshot } from '@/composables/useLocalFile';
import { t } from '@/utils/i18n';

/**
 * Strategy: Restores an in-memory snapshot saved to `sessionStorage`
 * from a previous drag-and-drop or local file pick session.
 */
export const sessionSnapshotStrategy: SourceFetchStrategy = () => {
  const stored = getStoredSnapshot();
  if (!stored) {
    return Promise.reject(new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')])));
  }

  return Promise.resolve({
    rawText: stored.text,
    byteSize: new Blob([stored.text]).size,
    fileName: stored.name,
    isLocalSnapshot: true,
    snapshotTimestamp: stored.timestamp,
    detectedFileType: stored.fileType,
  });
};
