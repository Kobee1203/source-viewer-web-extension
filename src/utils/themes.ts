import { browser } from 'wxt/browser';
import type { PublicPath } from 'wxt/browser';

export type ThemeType = 'light' | 'dark';

export interface Theme {
  id: string;
  name: string;
  type: ThemeType;
}

/**
 * Built-in themes. `id` matches the vendored CSS file in `public/themes/<id>.css`.
 * `type` drives the app chrome palette (see the CSS variables on <body>).
 */
export const THEMES: Theme[] = [
  { id: 'default', name: 'Default (Light)', type: 'light' },
  { id: 'coy', name: 'Coy (Light)', type: 'light' },
  { id: 'solarizedlight', name: 'Solarized Light (Light)', type: 'light' },
  { id: 'okaidia', name: 'Okaidia (Dark)', type: 'dark' },
  { id: 'tomorrow', name: 'Tomorrow Night (Dark)', type: 'dark' },
  { id: 'dark', name: 'Dark (Dark)', type: 'dark' },
  { id: 'funky', name: 'Funky (Dark)', type: 'dark' },
  { id: 'twilight', name: 'Twilight (Dark)', type: 'dark' },
];

export const DEFAULT_THEME_ID = 'default';

/**
 * Absolute URL of a theme's stylesheet, resolved via `browser.runtime.getURL` so it
 * loads correctly from any origin's shadow root (not just the extension's own pages).
 */
export function themeCssHref(id: string): string {
  return browser.runtime.getURL(`/themes/${id}.css` as PublicPath);
}

/** Resolves a theme id to its light/dark type (falls back to light). */
export function getThemeType(id: string): ThemeType {
  return THEMES.find((theme) => theme.id === id)?.type ?? 'light';
}
