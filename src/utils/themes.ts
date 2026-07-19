import {
  githubLight,
  githubDark,
  bbedit,
  solarizedLight,
  okaidia,
  tomorrowNightBlue,
  dracula,
  vscodeDark,
} from '@uiw/codemirror-themes-all';

export type ThemeType = 'light' | 'dark';

export interface Theme {
  id: string;
  name: string;
  type: ThemeType;
}

/**
 * Built-in themes mapped to CodeMirror 6 extensions.
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

/** Resolves a theme id to its CodeMirror extension. */
export function getThemeExtension(id: string) {
  switch (id) {
    case 'coy':
      return bbedit;
    case 'solarizedlight':
      return solarizedLight;
    case 'okaidia':
      return okaidia;
    case 'tomorrow':
      return tomorrowNightBlue;
    case 'dark':
      return githubDark;
    case 'funky':
      return dracula;
    case 'twilight':
      return vscodeDark;
    case 'default':
    default:
      return githubLight;
  }
}

/** Resolves a theme id to its light/dark type (falls back to light). */
export function getThemeType(id: string): ThemeType {
  return THEMES.find((theme) => theme.id === id)?.type ?? 'light';
}
