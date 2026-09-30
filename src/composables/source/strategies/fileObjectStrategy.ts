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
    const result = await readLocalFile(target.file);

    if (!target.handle && !target.isFromSession) {
      saveSnapshot(target.file.name, result.text, result.fileType, result.fontFormat);
    }

    return {
      rawText: result.isFont ? '' : result.text,
      byteSize: target.file.size,
      fileName: target.file.name,
      isLocalSnapshot: !target.handle,
      snapshotTimestamp: !target.handle ? Date.now() : null,
      fileHandle: target.handle ?? null,
      resourceType: result.isFont ? 'font' : 'code',
      fontBuffer: result.buffer,
      fontFormat: result.fontFormat,
      detectedFileType: result.isFont ? undefined : result.fileType,
    };
  } catch (err) {
    throw new SourceFetchError('generic', (err as Error).message);
  }
};
