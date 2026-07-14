import { ref } from 'vue';
import { requestSource } from '@/utils/messaging';
import { isRestricted } from '@/utils/restricted';
import { getFileType, type FileType } from '@/utils/fileType';
import { formatSource } from '@/utils/beautify';
import { t } from '@/utils/i18n';

/**
 * Fetches the source of the URL passed via the `?url=` query param (through the
 * background service worker), formats it, and exposes reactive view state.
 */
export function useSourceFetch() {
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);
  const errorWithNativeButton = ref(false);
  const code = ref('');
  const language = ref<FileType>('markup');
  const byteSize = ref<number | null>(null);
  const targetUrl = ref<URL | null>(null);

  async function load(): Promise<void> {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (!urlParam) return; // no target: leave the loader visible

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
        errorMessage.value = t('errorLoadSource', [
          response.error || t('errorUnknown'),
        ]);
        errorWithNativeButton.value = true;
        loading.value = false;
        return;
      }

      byteSize.value = new Blob([response.text]).size;
      const type = getFileType(target);
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
    load,
  };
}
