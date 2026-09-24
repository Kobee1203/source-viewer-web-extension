import { SourceFetchError, type SourceFetchStrategy } from '@/composables/source/types';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import type { FileType } from '@/utils/fileType';
import { t } from '@/utils/i18n';

/**
 * Strategy: Loads a file from the currently active local directory project
 * without attempting network or file:/// fetch calls.
 */
export const directoryFileStrategy: SourceFetchStrategy = async (target) => {
  const { getFile, rootName, setActivePath } = useLocalDirectory();

  let query: string;
  let targetUrl: URL | undefined;

  if (target.kind === 'directory-file') {
    query = target.path;
    targetUrl = target.url ?? new URL(`file:///${rootName.value}/${target.path}`);
  } else if (target.kind === 'url') {
    query = target.url.toString();
    targetUrl = target.url;
  } else {
    throw new SourceFetchError('generic', t('errorGeneric', [t('errorUnknown')]));
  }

  const dirFile = getFile(query);
  if (!dirFile) {
    throw new SourceFetchError('generic', t('errorGeneric', [`File not found in directory: ${query}`]));
  }

  await setActivePath(dirFile.path);

  const rawText = dirFile.text ?? '';
  const byteSize = dirFile.size ?? new Blob([rawText]).size;
  const detectedFileType = (dirFile.type as FileType) || undefined;

  return {
    rawText,
    byteSize,
    fileName: dirFile.name,
    targetUrl: targetUrl ?? new URL(`file:///${rootName.value}/${dirFile.path}`),
    detectedFileType,
    isDirectoryFile: true,
  };
};
