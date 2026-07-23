import { onUnmounted, ref } from 'vue';
import { isRestricted } from '@/utils/restricted';
import { t } from '@/utils/i18n';

/** CSS font-family the preview renders with. Fixed: only one font is previewed per page. */
export const PREVIEW_FONT_FAMILY = 'sv-font-preview';

/** Derives a display format label (e.g. "woff2") from a font URL's path extension. */
function formatFromUrl(target: URL): string {
  const match = /\.([a-z0-9]+)$/i.exec(target.pathname);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Loads the font of the URL passed via the `?url=` query param into the page as a usable
 * @font-face, and exposes reactive view state.
 *
 * The font is fetched here in the extension page (covered by `<all_urls>` host permissions,
 * so cross-origin without CORS), decoded natively by the browser via the FontFace API
 * (woff2 included — no parsing/decompression on our side), and added to `document.fonts`.
 * The added FontFace is removed again when the owning component unmounts.
 */
export function useFontLoad() {
  const loading = ref(true);
  const errorMessage = ref<string | null>(null);
  const targetUrl = ref<URL | null>(null);
  const fontFamily = ref('');
  const fileSize = ref<number | null>(null);
  const format = ref('');

  let face: FontFace | null = null;

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
    format.value = formatFromUrl(target);

    // Restricted URLs cannot be fetched by extensions.
    if (isRestricted(target)) {
      errorMessage.value = t('errorRestricted');
      loading.value = false;
      return;
    }

    try {
      const response = await fetch(target.toString());
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

      const buffer = await response.arrayBuffer();
      fileSize.value = buffer.byteLength;

      face = new FontFace(PREVIEW_FONT_FAMILY, buffer);
      await face.load();
      document.fonts.add(face);
      fontFamily.value = PREVIEW_FONT_FAMILY;
      loading.value = false;
    } catch (err) {
      loading.value = false;
      errorMessage.value = t('fontViewerError', [(err as Error).message || t('errorUnknown')]);
      console.error(err);
    }
  }

  onUnmounted(() => {
    if (face) document.fonts.delete(face);
  });

  return { loading, errorMessage, targetUrl, fontFamily, fileSize, format, load };
}
