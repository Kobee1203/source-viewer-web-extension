import { onUnmounted, ref } from 'vue';
import { browser } from 'wxt/browser';
import { t } from '@/utils/i18n';
import { isRestricted } from '@/utils/restricted';

/** CSS font-family the preview renders with. Fixed: only one font is previewed per page. */
export const PREVIEW_FONT_FAMILY = 'sv-font-preview';

/** Derives a display format label (e.g. "woff2") from a font URL or filename. */
export function formatFromUrl(target: URL | string): string {
  try {
    const pathname = typeof target === 'string' ? new URL(target, 'http://localhost').pathname : target.pathname;
    const match = /\.([a-z0-9]+)$/i.exec(pathname);
    return match?.[1]?.toLowerCase() ?? '';
  } catch {
    return '';
  }
}

/**
 * Loads a font into the page as a usable @font-face and exposes reactive view state.
 *
 * Supported inputs:
 * - Direct remote / local URL
 * - In-memory ArrayBuffer or Uint8Array (from local files or directory project)
 *
 * The FontFace is decoded natively by the browser and added to `document.fonts`.
 * It can be proactively removed via `unload()`, and is cleaned up on unmount.
 */
export function useFontLoad() {
  const loading = ref(false);
  const errorMessage = ref<string | null>(null);
  const targetUrl = ref<URL | null>(null);
  const fontFamily = ref('');
  const fileSize = ref<number | null>(null);
  const format = ref('');

  let face: FontFace | null = null;

  function unload(): void {
    if (face) {
      document.fonts.delete(face);
      face = null;
    }
    fontFamily.value = '';
    fileSize.value = null;
    format.value = '';
    targetUrl.value = null;
    errorMessage.value = null;
    loading.value = false;
  }

  async function loadFromBuffer(buffer: ArrayBuffer, fontFormat = '', url?: URL): Promise<void> {
    unload();
    loading.value = true;
    targetUrl.value = url ?? null;

    try {
      fileSize.value = buffer.byteLength;
      format.value = fontFormat;

      face = new FontFace(PREVIEW_FONT_FAMILY, buffer);
      await face.load();
      document.fonts.add(face);
      fontFamily.value = PREVIEW_FONT_FAMILY;
      loading.value = false;
    } catch (err) {
      loading.value = false;
      errorMessage.value = t('fontViewerError', [(err as Error).message || t('errorUnknown')]);
      console.error('Failed to load font from buffer:', err);
    }
  }

  async function loadFromUrl(urlInput: URL | string): Promise<void> {
    unload();
    loading.value = true;

    let target: URL;
    try {
      target = typeof urlInput === 'string' ? new URL(urlInput) : urlInput;
    } catch {
      loading.value = false;
      errorMessage.value = t('errorGeneric', [t('errorUnknown')]);
      return;
    }

    format.value = formatFromUrl(target);

    // Restricted URLs cannot be fetched by extensions.
    if (isRestricted(target)) {
      errorMessage.value = t('errorRestricted');
      loading.value = false;
      return;
    }

    if (target.protocol === 'file:') {
      const isAllowed = await browser.extension.isAllowedFileSchemeAccess().catch(() => false);
      if (!isAllowed) {
        errorMessage.value = t('fileSchemePermissionHelp');
        loading.value = false;
        return;
      }
    }

    try {
      const response = await fetch(target.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

      const buffer = await response.arrayBuffer();
      await loadFromBuffer(buffer, format.value, target);
    } catch (err) {
      loading.value = false;
      errorMessage.value = t('fontViewerError', [(err as Error).message || t('errorUnknown')]);
      console.error('Failed to load font from URL:', err);
    }
  }

  async function load(explicitUrl?: URL | string): Promise<void> {
    if (explicitUrl) {
      await loadFromUrl(explicitUrl);
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (!urlParam) {
      unload();
      return;
    }

    await loadFromUrl(urlParam);
  }

  onUnmounted(() => {
    unload();
  });

  return {
    loading,
    errorMessage,
    targetUrl,
    fontFamily,
    fileSize,
    format,
    load,
    loadFromUrl,
    loadFromBuffer,
    unload,
  };
}
