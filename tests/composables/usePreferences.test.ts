import { nextTick } from 'vue';
import { mockBrowser } from '@@/tests/setup';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CONTEXT_MENU, DEFAULT_OPEN_IN, usePreferences } from '@/composables/usePreferences';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { DEFAULT_THEME_ID } from '@/utils/themes';

describe('usePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default values when storage is empty', () => {
    const prefs = usePreferences();

    expect(prefs.themeId.value).toBe(DEFAULT_THEME_ID);
    expect(prefs.wordWrap.value).toBe(false);
    expect(prefs.codeFontSize.value).toBe(DEFAULT_FONT_SIZE);
    expect(prefs.openIn.value).toBe(DEFAULT_OPEN_IN);
    expect(prefs.contextMenu.value).toBe(DEFAULT_CONTEXT_MENU);
  });

  it('initializes from localStorage synchronously', () => {
    localStorage.setItem('viewer-contextMenu', 'false');
    localStorage.setItem('viewer-openIn', 'current-tab');
    localStorage.setItem('viewer-wordWrap', 'true');
    localStorage.setItem('viewer-codeFontSize', '18');

    const prefs = usePreferences();

    expect(prefs.contextMenu.value).toBe(false);
    expect(prefs.openIn.value).toBe('current-tab');
    expect(prefs.wordWrap.value).toBe(true);
    expect(prefs.codeFontSize.value).toBe(18);
  });

  it('updates preferences from browser.storage.local', async () => {
    mockBrowser.storage.local.get.mockResolvedValueOnce({
      contextMenu: false,
      openIn: 'current-tab',
      wordWrap: true,
      codeFontSize: 16,
    });

    const prefs = usePreferences();

    // Allow promise in usePreferences to resolve
    await Promise.resolve();
    await nextTick();

    expect(prefs.contextMenu.value).toBe(false);
    expect(prefs.openIn.value).toBe('current-tab');
    expect(prefs.wordWrap.value).toBe(true);
    expect(prefs.codeFontSize.value).toBe(16);
    expect(localStorage.getItem('viewer-contextMenu')).toBe('false');
    expect(localStorage.getItem('viewer-openIn')).toBe('current-tab');
  });

  it('syncs contextMenu updates to localStorage and browser.storage.local', async () => {
    const prefs = usePreferences();

    prefs.contextMenu.value = false;
    await nextTick();

    expect(localStorage.getItem('viewer-contextMenu')).toBe('false');
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({ contextMenu: false });

    prefs.contextMenu.value = true;
    await nextTick();

    expect(localStorage.getItem('viewer-contextMenu')).toBe('true');
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({ contextMenu: true });
  });

  it('syncs openIn updates to localStorage and browser.storage.local', async () => {
    const prefs = usePreferences();

    prefs.openIn.value = 'current-tab';
    await nextTick();

    expect(localStorage.getItem('viewer-openIn')).toBe('current-tab');
    expect(mockBrowser.storage.local.set).toHaveBeenCalledWith({ openIn: 'current-tab' });
  });
});
