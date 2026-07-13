import { ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import { DEFAULT_THEME_ID, THEMES } from '../utils/themes';

/**
 * Reactive user preferences (theme + word wrap) backed by browser.storage.local.
 * An unknown stored theme id (e.g. from an older version) falls back to the default.
 */
export function usePreferences() {
  const themeId = ref(DEFAULT_THEME_ID);
  const wordWrap = ref(false);

  browser.storage.local.get(['theme', 'wordWrap']).then((result) => {
    const savedTheme = result.theme;
    if (
      typeof savedTheme === 'string' &&
      THEMES.some((theme) => theme.id === savedTheme)
    ) {
      themeId.value = savedTheme;
    }
    if (typeof result.wordWrap === 'boolean') {
      wordWrap.value = result.wordWrap;
    }
  });

  watch(themeId, (value) => {
    browser.storage.local.set({ theme: value });
  });
  watch(wordWrap, (value) => {
    browser.storage.local.set({ wordWrap: value });
  });

  return { themeId, wordWrap };
}
