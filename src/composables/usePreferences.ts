import { ref, watch } from 'vue';
import { browser } from 'wxt/browser';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { DEFAULT_THEME_ID, THEMES, getThemeType } from '@/utils/themes';

export type OpenInMode = 'new-tab' | 'current-tab';
export const DEFAULT_OPEN_IN: OpenInMode = 'new-tab';

function getInitialTheme(): string {
  try {
    const local = localStorage.getItem('viewer-theme');
    if (typeof local === 'string' && THEMES.some((theme) => theme.id === local)) {
      return local;
    }
  } catch {}
  return DEFAULT_THEME_ID;
}

function getInitialWordWrap(): boolean {
  try {
    const local = localStorage.getItem('viewer-wordWrap');
    if (local !== null) return local === 'true';
  } catch {}
  return false;
}

function getInitialFontSize(): number {
  try {
    const local = localStorage.getItem('viewer-codeFontSize');
    if (local !== null) {
      const num = parseInt(local, 10);
      if (!Number.isNaN(num)) return num;
    }
  } catch {}
  return DEFAULT_FONT_SIZE;
}

function getInitialOpenIn(): OpenInMode {
  try {
    const local = localStorage.getItem('viewer-openIn');
    if (local === 'current-tab' || local === 'new-tab') return local;
  } catch {}
  return DEFAULT_OPEN_IN;
}

/**
 * Reactive user preferences (theme + word wrap + code font size + open in mode) backed by browser.storage.local.
 * Initialized synchronously from window.localStorage to eliminate initial visual flicker.
 */
export function usePreferences() {
  const themeId = ref(getInitialTheme());
  const wordWrap = ref(getInitialWordWrap());
  const codeFontSize = ref(getInitialFontSize());
  const openIn = ref<OpenInMode>(getInitialOpenIn());

  try {
    if (!localStorage.getItem('viewer-theme-type')) {
      localStorage.setItem('viewer-theme-type', getThemeType(themeId.value));
    }
  } catch {}

  void browser.storage.local.get(['theme', 'wordWrap', 'codeFontSize', 'openIn']).then((result) => {
    const savedTheme = result.theme;
    if (typeof savedTheme === 'string' && THEMES.some((theme) => theme.id === savedTheme)) {
      themeId.value = savedTheme;
      try {
        localStorage.setItem('viewer-theme', savedTheme);
        localStorage.setItem('viewer-theme-type', getThemeType(savedTheme));
      } catch {}
    }
    if (typeof result.wordWrap === 'boolean') {
      wordWrap.value = result.wordWrap;
      try {
        localStorage.setItem('viewer-wordWrap', String(result.wordWrap));
      } catch {}
    }
    if (typeof result.codeFontSize === 'number') {
      codeFontSize.value = result.codeFontSize;
      try {
        localStorage.setItem('viewer-codeFontSize', String(result.codeFontSize));
      } catch {}
    }
    if (result.openIn === 'current-tab' || result.openIn === 'new-tab') {
      openIn.value = result.openIn;
      try {
        localStorage.setItem('viewer-openIn', result.openIn);
      } catch {}
    }
  });

  watch(themeId, (value) => {
    try {
      localStorage.setItem('viewer-theme', value);
      localStorage.setItem('viewer-theme-type', getThemeType(value));
    } catch {}
    void browser.storage.local.set({ theme: value });
  });
  watch(wordWrap, (value) => {
    try {
      localStorage.setItem('viewer-wordWrap', String(value));
    } catch {}
    void browser.storage.local.set({ wordWrap: value });
  });
  watch(codeFontSize, (value) => {
    try {
      localStorage.setItem('viewer-codeFontSize', String(value));
    } catch {}
    void browser.storage.local.set({ codeFontSize: value });
  });
  watch(openIn, (value) => {
    try {
      localStorage.setItem('viewer-openIn', value);
    } catch {}
    void browser.storage.local.set({ openIn: value });
  });

  return { themeId, wordWrap, codeFontSize, openIn };
}
