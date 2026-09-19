import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { readLocalFile, saveSnapshot } from '@/composables/useLocalFile';
import { t } from '@/utils/i18n';

/**
 * Strategy: Reads a local `File` or `FileSystemFileHandle` provided via
 * drag-and-drop or file picker.
 */
export const fileObjectStrategy: SourceFetchStrategy = async (target) => {
  if (target.kind !== 'file') {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  try {
    const { text, fileType } = await readLocalFile(target.file);

    if (!target.handle && !target.isFromSession) {
      saveSnapshot(target.file.name, text, fileType);
    }

    return {
      rawText: text,
      byteSize: target.file.size,
      fileName: target.file.name,
      isLocalSnapshot: !target.handle,
      snapshotTimestamp: !target.handle ? Date.now() : null,
      fileHandle: target.handle ?? null,
      detectedFileType: fileType,
    };
  } catch (err) {
    throw new SourceFetchError('generic', (err as Error).message);
  }
};
