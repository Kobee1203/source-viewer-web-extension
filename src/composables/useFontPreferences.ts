import { ref } from 'vue';
import { t } from '@/utils/i18n';

/** Default preview font size, in pixels. */
const DEFAULT_FONT_SIZE = 48;

/**
 * Reactive font-preview settings (preview text, size, bold, italic, background).
 * Not persisted for now — kept in a composable to mirror {@link usePreferences} and to make
 * adding `browser.storage.local` backing later a localized change.
 */
export function useFontPreferences() {
  const previewText = ref(t('fontViewerSample'));
  const fontSize = ref(DEFAULT_FONT_SIZE);
  const bold = ref(false);
  const italic = ref(false);
  const darkBg = ref(false);

  return { previewText, fontSize, bold, italic, darkBg };
}
