import { ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { DEFAULT_THEME_ID, THEMES } from '@/utils/themes';

/**
 * Reactive user preferences (theme + word wrap) backed by browser.storage.local.
 * An unknown stored theme id (e.g. from an older version) falls back to the default.
 */
export function usePreferences() {
  const themeId = ref(DEFAULT_THEME_ID);
  const wordWrap = ref(false);
  const codeFontSize = ref(DEFAULT_FONT_SIZE);

  void browser.storage.local.get(['theme', 'wordWrap', 'codeFontSize']).then((result) => {
    const savedTheme = result.theme;
    if (typeof savedTheme === 'string' && THEMES.some((theme) => theme.id === savedTheme)) {
      themeId.value = savedTheme;
    }
    if (typeof result.wordWrap === 'boolean') {
      wordWrap.value = result.wordWrap;
    }
    if (typeof result.codeFontSize === 'number') {
      codeFontSize.value = result.codeFontSize;
    }
  });

  watch(themeId, (value) => {
    void browser.storage.local.set({ theme: value });
  });
  watch(wordWrap, (value) => {
    void browser.storage.local.set({ wordWrap: value });
  });
  watch(codeFontSize, (value) => {
    void browser.storage.local.set({ codeFontSize: value });
  });

  return { themeId, wordWrap, codeFontSize };
}
