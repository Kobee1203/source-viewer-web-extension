import { computed, ref } from 'vue';
import { browser } from 'wxt/browser';
import { getStoredSnapshot, readLocalFile, saveSnapshot } from '@/composables/useLocalFile';
import { formatSource } from '@/utils/beautify';
import { mimeToFileType } from '@/utils/contentType';
import { DEFAULT_FILE_TYPE, type FileType, getFileType } from '@/utils/fileType';
import { t } from '@/utils/i18n';
import { requestSource } from '@/utils/messaging';
import { isRestricted } from '@/utils/restricted';

/**
 * Fetches the source of the URL passed via the `?url=` query param (through the
 * background service worker or in-place DOM messaging / direct fetch for local files),
 * formats it, and exposes reactive view state. Also supports loading directly from
 * local File objects and FileSystemFileHandles.
 */
export function useSourceFetch() {
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);
  const errorWithNativeButton = ref(false);
  const fileAccessDenied = ref(false);
  const code = ref('');
  const rawCode = ref('');
  const language = ref<FileType>(DEFAULT_FILE_TYPE);
  const byteSize = ref<number | null>(null);
  const targetUrl = ref<URL | null>(null);
  const fileName = ref<string | null>(null);
  const isLocalSnapshot = ref(false);
  const snapshotTimestamp = ref<number | null>(null);
  const activeFileHandle = ref<FileSystemFileHandle | null>(null);
  const contentDisposition = ref<string | null>(null);
  const httpStatus = ref<number | null>(null);
  const httpStatusText = ref('');

  async function loadFromLocalFile(file: File, handle?: FileSystemFileHandle, isFromSession = false): Promise<void> {
    loading.value = true;
    errorMessage.value = null;
    errorWithNativeButton.value = false;
    fileAccessDenied.value = false;
    targetUrl.value = null;
    httpStatus.value = null;
    httpStatusText.value = '';
    contentDisposition.value = null;

    activeFileHandle.value = handle ?? null;
    fileName.value = file.name;
    isLocalSnapshot.value = !handle;
    snapshotTimestamp.value = !handle ? Date.now() : null;

    try {
      const { text, fileType } = await readLocalFile(file);
      rawCode.value = text;
      language.value = fileType;
      code.value = formatSource(text, fileType);
      byteSize.value = file.size;
      loading.value = false;

      if (!handle && !isFromSession) {
        saveSnapshot(file.name, text, fileType);
      }
    } catch (err) {
      loading.value = false;
      errorMessage.value = t('errorGeneric', [(err as Error).message]);
    }
  }

  async function reloadLocalFile(): Promise<void> {
    if (!activeFileHandle.value) return;
    try {
      const file = await activeFileHandle.value.getFile();
      await loadFromLocalFile(file, activeFileHandle.value);
    } catch (err) {
      errorMessage.value = t('errorGeneric', [(err as Error).message]);
    }
  }

  async function fetchLocalInplaceSource(): Promise<string | null> {
    if (window.self === window.top) return null; // not embedded in an iframe
    return new Promise((resolve) => {
      let resolved = false;
      const handler = (event: MessageEvent) => {
        if (
          typeof event.data === 'object' &&
          event.data !== null &&
          (event.data as { type?: unknown }).type === 'INPLACE_LOCAL_SOURCE_DATA'
        ) {
          window.removeEventListener('message', handler);
          resolved = true;
          const text = (event.data as { text?: unknown }).text;
          resolve(typeof text === 'string' ? text : '');
        }
      };
      window.addEventListener('message', handler);
      window.parent.postMessage({ type: 'REQUEST_INPLACE_LOCAL_SOURCE' }, '*');

      setTimeout(() => {
        if (!resolved) {
          window.removeEventListener('message', handler);
          resolve(null);
        }
      }, 500);
    });
  }

  async function load(explicitUrl?: string): Promise<void> {
    // Reset reactive state so a re-fetch always starts from a clean slate.
    loading.value = true;
    errorMessage.value = null;
    errorWithNativeButton.value = false;
    fileAccessDenied.value = false;
    code.value = '';
    rawCode.value = '';
    byteSize.value = null;
    contentDisposition.value = null;
    httpStatus.value = null;
    httpStatusText.value = '';

    const searchParams = new URLSearchParams(window.location.search);
    const urlParam = explicitUrl ?? searchParams.get('url');
    const isFileAccessDisallowed = searchParams.get('fileAccess') === '0';

    if (!urlParam) {
      // Check if a stored snapshot exists from a previous session / refresh
      const stored = getStoredSnapshot();
      if (stored) {
        fileName.value = stored.name;
        language.value = stored.fileType;
        rawCode.value = stored.text;
        code.value = formatSource(stored.text, stored.fileType);
        byteSize.value = new Blob([stored.text]).size;
        isLocalSnapshot.value = true;
        snapshotTimestamp.value = stored.timestamp;
        loading.value = false;
        return;
      }
      loading.value = false;
      return;
    }

    // Keep the address bar in sync when navigating internally from the sidebar.
    // Preserve the `root` param (set on first navigation) so that a page reload can
    // reconstruct the initial VFS tree even when the viewer is showing a child file.
    if (explicitUrl) {
      const next = new URL(window.location.href);
      if (!next.searchParams.has('root')) {
        const currentUrl = next.searchParams.get('url');
        if (currentUrl) next.searchParams.set('root', currentUrl);
      }
      next.searchParams.set('url', explicitUrl);
      history.pushState(null, '', next.toString());
    }

    let target: URL;
    try {
      target = new URL(urlParam);
    } catch {
      loading.value = false;
      errorMessage.value = t('errorGeneric', [t('errorUnknown')]);
      return;
    }
    targetUrl.value = target;

    // Restricted URLs cannot be fetched by extensions: offer the native viewer.
    if (isRestricted(target)) {
      errorMessage.value = t('errorRestricted');
      errorWithNativeButton.value = true;
      loading.value = false;
      return;
    }

    // Check if file scheme access is explicitly flagged as disallowed
    if (target.protocol === 'file:' && isFileAccessDisallowed) {
      fileAccessDenied.value = true;
      loading.value = false;
      return;
    }

    // For local files embedded in the in-place iframe, request the host DOM text directly
    if (target.protocol === 'file:' && window.self !== window.top) {
      const inplaceText = await fetchLocalInplaceSource();
      if (inplaceText !== null) {
        const type = getFileType(target);
        language.value = type;
        rawCode.value = inplaceText;
        code.value = formatSource(inplaceText, type);
        byteSize.value = new Blob([inplaceText]).size;
        loading.value = false;
        return;
      }
    }

    // For standalone tabs on local files, try direct fetch from extension page
    if (target.protocol === 'file:') {
      try {
        const res = await fetch(target.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        const text = await res.text();
        const type = getFileType(target);
        language.value = type;
        rawCode.value = text;
        code.value = formatSource(text, type);
        byteSize.value = new Blob([text]).size;
        loading.value = false;
        return;
      } catch (err) {
        const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
        if (!isAllowed) {
          fileAccessDenied.value = true;
          loading.value = false;
          return;
        }
        console.error('Direct fetch of local file failed:', err);
      }
    }

    // Default fetch via background service worker
    try {
      const response = await requestSource(target.toString());

      if (!response.ok) {
        if (target.protocol === 'file:') {
          const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
          if (!isAllowed) {
            fileAccessDenied.value = true;
            loading.value = false;
            return;
          }
        }
        console.error(`Error fetching source code: ${response.error}`);
        errorMessage.value = t('errorLoadSource', [response.error || t('errorUnknown')]);
        errorWithNativeButton.value = true;
        loading.value = false;
        return;
      }

      byteSize.value = response.byteLength;
      contentDisposition.value = response.contentDisposition;
      httpStatus.value = response.httpStatus;
      httpStatusText.value = response.httpStatusText;
      // Prefer the response's real MIME (handles extensionless URLs like fonts.googleapis.com/css2?…); fall back to the URL extension.
      const type = mimeToFileType(response.contentType) ?? getFileType(target);
      language.value = type;
      rawCode.value = response.text;
      code.value = formatSource(response.text, type);
      loading.value = false;
    } catch (err) {
      loading.value = false;
      errorMessage.value = t('errorGeneric', [(err as Error).message]);
      console.error(err);
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
    snapshotTimestamp,
    hasFileHandle: computed(() => activeFileHandle.value !== null),
    contentDisposition,
    httpStatus,
    httpStatusText,
    load,
    loadFromLocalFile,
    reloadLocalFile,
  };
}
