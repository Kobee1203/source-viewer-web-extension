import { computed, ref } from 'vue';
import { resolveFetchStrategy } from '@/composables/source/resolver';
import {
  type RawSourcePayload,
  type SourceErrorKind,
  SourceFetchError,
  type SourceStatus,
  type SourceTarget,
} from '@/composables/source/types';
import { useViewerNavigation } from '@/composables/source/useViewerNavigation';
import { useLocalDirectory } from '@/composables/useLocalDirectory';
import { getStoredSnapshot } from '@/composables/useLocalFile';
import { formatSource } from '@/utils/beautify';
import { mimeToFileType } from '@/utils/contentType';
import { DEFAULT_FILE_TYPE, type FileType, getFileType } from '@/utils/fileType';
import { t } from '@/utils/i18n';
import { requestRefreshTabSource } from '@/utils/messaging';

interface FatalErrorState {
  kind: SourceErrorKind;
  message: string;
  allowNativeFallback: boolean;
}

/**
 * Orchestrates acquiring source code from remote URLs, local file scheme,
 * in-place DOM extraction, drag-and-drop files, or persisted session snapshots.
 *
 * Formats the acquired source via `formatSource` (js-beautify) and exposes
 * reactive state to viewer components.
 */
export function useSourceFetch() {
  const navigation = useViewerNavigation();

  // Internal state machine
  const status = ref<SourceStatus>('idle');
  const fatalError = ref<FatalErrorState | null>(null);

  // Content state
  const code = ref('');
  const rawCode = ref('');
  const language = ref<FileType>(DEFAULT_FILE_TYPE);
  const byteSize = ref<number | null>(null);

  // Metadata state
  const targetUrl = ref<URL | null>(null);
  const fileName = ref<string | null>(null);
  const isLocalSnapshot = ref(false);
  const isDomFallback = ref(false);
  const isSourceTabClosed = ref(false);
  const isDirectoryFile = ref(false);
  const snapshotTimestamp = ref<number | null>(null);
  const activeFileHandle = ref<FileSystemFileHandle | null>(null);
  const contentDisposition = ref<string | null>(null);
  const httpStatus = ref<number | null>(null);
  const httpStatusText = ref('');

  // Backward-compatible computed properties
  const loading = computed(() => status.value === 'loading');
  const errorMessage = computed(() => fatalError.value?.message ?? null);
  const errorWithNativeButton = computed(() => fatalError.value?.allowNativeFallback ?? false);
  const fileAccessDenied = computed(() => fatalError.value?.kind === 'file-access-denied');
  const hasFileHandle = computed(() => activeFileHandle.value !== null);

  function resetState(): void {
    fatalError.value = null;
    code.value = '';
    rawCode.value = '';
    byteSize.value = null;
    contentDisposition.value = null;
    httpStatus.value = null;
    httpStatusText.value = '';
    targetUrl.value = null;
    fileName.value = null;
    isLocalSnapshot.value = false;
    isDomFallback.value = false;
    isSourceTabClosed.value = false;
    isDirectoryFile.value = false;
    snapshotTimestamp.value = null;
  }

  async function executePipeline(target: SourceTarget): Promise<void> {
    resetState();
    status.value = 'loading';

    try {
      const strategy = resolveFetchStrategy(target);
      const payload: RawSourcePayload = await strategy(target);

      // Language detection: explicit type -> MIME type -> URL / filename extension
      let detectedType: FileType = DEFAULT_FILE_TYPE;
      if (payload.detectedFileType) {
        detectedType = payload.detectedFileType;
      } else if (payload.mimeType) {
        detectedType = mimeToFileType(payload.mimeType) ?? DEFAULT_FILE_TYPE;
      } else if (payload.targetUrl) {
        detectedType = getFileType(payload.targetUrl);
      } else if (payload.fileName) {
        detectedType = getFileType(new URL(payload.fileName, 'file:///'));
      }

      language.value = detectedType;
      rawCode.value = payload.rawText;
      code.value = formatSource(payload.rawText, detectedType);
      byteSize.value = payload.byteSize;

      targetUrl.value = payload.targetUrl ?? null;
      fileName.value = payload.fileName ?? null;
      isLocalSnapshot.value = payload.isLocalSnapshot ?? false;
      isDomFallback.value = payload.isDomFallback ?? false;
      isSourceTabClosed.value = payload.isSourceTabClosed ?? false;
      isDirectoryFile.value = payload.isDirectoryFile ?? false;
      snapshotTimestamp.value = payload.snapshotTimestamp ?? null;
      activeFileHandle.value = payload.fileHandle ?? null;
      contentDisposition.value = payload.contentDisposition ?? null;
      httpStatus.value = payload.httpStatus ?? null;
      httpStatusText.value = payload.httpStatusText ?? '';

      status.value = 'success';
    } catch (err) {
      status.value = 'error';
      if (err instanceof SourceFetchError) {
        fatalError.value = {
          kind: err.kind,
          message: err.message,
          allowNativeFallback: err.allowNativeFallback,
        };
      } else {
        fatalError.value = {
          kind: 'generic',
          message: t('errorGeneric', [(err as Error).message]),
          allowNativeFallback: false,
        };
      }
    }
  }

  async function load(explicitUrl?: string): Promise<void> {
    status.value = 'loading';

    const { isLoaded: dirLoaded, activePath: dirActivePath, getFile, restoreFromStorage } = useLocalDirectory();

    if (explicitUrl) {
      if (dirLoaded.value && getFile(explicitUrl)) {
        navigation.clearUrl();
        const dirFile = getFile(explicitUrl)!;
        await executePipeline({ kind: 'directory-file', path: dirFile.path });
        return;
      }
      navigation.navigateTo(explicitUrl);
    } else {
      navigation.syncFromLocation();
    }

    const urlParam = explicitUrl ?? navigation.currentUrl.value;

    if (!urlParam) {
      if (!dirLoaded.value) {
        await restoreFromStorage();
      }
      if (dirLoaded.value && dirActivePath.value) {
        await executePipeline({ kind: 'directory-file', path: dirActivePath.value });
        return;
      }

      const stored = getStoredSnapshot();
      if (stored) {
        await executePipeline({ kind: 'snapshot' });
        return;
      }
      resetState();
      status.value = 'idle';
      return;
    }

    if (dirLoaded.value) {
      const matchingDirFile = getFile(urlParam);
      if (matchingDirFile) {
        navigation.clearUrl();
        await executePipeline({ kind: 'directory-file', path: matchingDirFile.path });
        return;
      }
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(urlParam);
    } catch {
      resetState();
      status.value = 'error';
      fatalError.value = {
        kind: 'generic',
        message: t('errorGeneric', [t('errorUnknown')]),
        allowNativeFallback: false,
      };
      return;
    }

    await executePipeline({
      kind: 'url',
      url: parsedUrl,
      fileAccessDisallowed: navigation.fileAccessDisallowed.value,
    });
  }

  async function loadFromLocalFile(file: File, handle?: FileSystemFileHandle, isFromSession = false): Promise<void> {
    navigation.clearUrl();
    await executePipeline({
      kind: 'file',
      file,
      handle,
      isFromSession,
    });
  }

  async function loadFromDirectoryFile(path: string): Promise<void> {
    navigation.clearUrl();
    await executePipeline({
      kind: 'directory-file',
      path,
    });
  }

  async function reloadLocalFile(): Promise<void> {
    if (!activeFileHandle.value) return;
    try {
      const file = await activeFileHandle.value.getFile();
      await loadFromLocalFile(file, activeFileHandle.value);
    } catch (err) {
      status.value = 'error';
      fatalError.value = {
        kind: 'generic',
        message: t('errorGeneric', [(err as Error).message]),
        allowNativeFallback: false,
      };
    }
  }

  async function refreshSource(): Promise<void> {
    if (isDirectoryFile.value) {
      const { activePath: dirActivePath } = useLocalDirectory();
      if (dirActivePath.value) {
        await loadFromDirectoryFile(dirActivePath.value);
        return;
      }
    }

    if (activeFileHandle.value) {
      await reloadLocalFile();
      return;
    }

    status.value = 'loading';
    try {
      const refreshRes = await requestRefreshTabSource();
      if (refreshRes.ok && refreshRes.source) {
        rawCode.value = refreshRes.source.text;
        code.value = formatSource(refreshRes.source.text, language.value);
        byteSize.value = refreshRes.source.byteSize;
        isDomFallback.value = refreshRes.source.isDomFallback;
        isSourceTabClosed.value = false;
        snapshotTimestamp.value = refreshRes.source.timestamp;
        status.value = 'success';
        return;
      }

      if (refreshRes.sourceTabClosed) {
        isSourceTabClosed.value = true;
        status.value = 'success';
        return;
      }

      if (targetUrl.value) {
        await load(targetUrl.value.toString());
      } else {
        status.value = 'success';
      }
    } catch {
      if (targetUrl.value) {
        await load(targetUrl.value.toString());
      } else {
        status.value = 'idle';
      }
    }
  }

  return {
    loading,
    errorMessage,
    errorWithNativeButton,
    fileAccessDenied,
    code,
    rawCode,
    language,
    byteSize,
    targetUrl,
    fileName,
    isLocalSnapshot,
    isDomFallback,
    isSourceTabClosed,
    isDirectoryFile,
    snapshotTimestamp,
    hasFileHandle,
    contentDisposition,
    httpStatus,
    httpStatusText,
    load,
    loadFromLocalFile,
    loadFromDirectoryFile,
    reloadLocalFile,
    refreshSource,
    clearUrl: navigation.clearUrl,
  };
}
