import { ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { DEFAULT_THEME_ID, THEMES } from '@/utils/themes';

export type OpenInMode = 'new-tab' | 'current-tab';
export const DEFAULT_OPEN_IN: OpenInMode = 'new-tab';

/**
 * Reactive user preferences (theme + word wrap + code font size + open in mode) backed by browser.storage.local.
 * An unknown stored theme id (e.g. from an older version) falls back to the default.
 */
export function usePreferences() {
  const themeId = ref(DEFAULT_THEME_ID);
  const wordWrap = ref(false);
  const codeFontSize = ref(DEFAULT_FONT_SIZE);
  const openIn = ref<OpenInMode>(DEFAULT_OPEN_IN);

  void browser.storage.local.get(['theme', 'wordWrap', 'codeFontSize', 'openIn']).then((result) => {
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
    if (result.openIn === 'current-tab' || result.openIn === 'new-tab') {
      openIn.value = result.openIn;
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
  watch(openIn, (value) => {
    void browser.storage.local.set({ openIn: value });
  });

  return { themeId, wordWrap, codeFontSize, openIn };
}
