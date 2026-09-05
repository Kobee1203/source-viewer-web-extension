import { ref } from 'vue';
import { formatSource } from '@/utils/beautify';
import { mimeToFileType } from '@/utils/contentType';
import { DEFAULT_FILE_TYPE, type FileType, getFileType } from '@/utils/fileType';
import { t } from '@/utils/i18n';
import { requestSource } from '@/utils/messaging';
import { isRestricted } from '@/utils/restricted';

/**
 * Fetches the source of the URL passed via the `?url=` query param (through the
 * background service worker), formats it, and exposes reactive view state.
 */
export function useSourceFetch() {
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);
  const errorWithNativeButton = ref(false);
  const code = ref('');
  const language = ref<FileType>(DEFAULT_FILE_TYPE);
  const byteSize = ref<number | null>(null);
  const targetUrl = ref<URL | null>(null);
  const contentDisposition = ref<string | null>(null);
  const httpStatus = ref<number | null>(null);
  const httpStatusText = ref('');

  async function load(explicitUrl?: string): Promise<void> {
    // Reset reactive state so a re-fetch always starts from a clean slate.
    loading.value = true;
    errorMessage.value = null;
    errorWithNativeButton.value = false;
    code.value = '';
    byteSize.value = null;
    contentDisposition.value = null;
    httpStatus.value = null;
    httpStatusText.value = '';

    const urlParam = explicitUrl ?? new URLSearchParams(window.location.search).get('url');
    if (!urlParam) {
      loading.value = false;
      return;
    }

    // Keep the address bar in sync when navigating internally from the sidebar.
    if (explicitUrl) {
      const next = new URL(window.location.href);
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

    try {
      const response = await requestSource(target.toString());

      if (!response.ok) {
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
    code,
    language,
    byteSize,
    targetUrl,
    contentDisposition,
    httpStatus,
    httpStatusText,
    load,
  };
}
