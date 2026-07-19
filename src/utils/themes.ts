import type { Extension } from '@codemirror/state';

export type ThemeType = 'light' | 'dark';

export interface Theme {
  id: string;
  name: string;
  type: ThemeType;
}

/** A theme plus a lazy loader for the CodeMirror extension that renders it. */
interface ThemeDef extends Theme {
  /**
   * Loads the theme's CodeMirror extension on demand. Each loader targets an individual
   * `@uiw/codemirror-theme-*` package via dynamic `import()`, so every theme becomes its
   * own lazily-loaded chunk instead of being inlined into the viewer bundle — only the
   * selected theme is fetched (from the packaged extension, no network) and parsed.
   * Light/dark siblings share a package, hence the same chunk.
   */
  load: () => Promise<Extension>;
}

/**
 * Built-in themes from `@uiw/codemirror-theme-*`. Single source of truth: {@link THEMES}
 * (metadata) and {@link getThemeExtension} (rendering) are derived from it, so ids can't
 * drift between the two. The first entry is the default.
 *
 * `id` is a stable kebab-case slug (persisted in `storage.local`); `type` drives the app
 * chrome palette (see the CSS variables on <body>). The default id `default` maps to Basic
 * Light. Note `material` and `materialDark` are the same CodeMirror theme, so only the
 * dark/light pair is exposed.
 */
const THEME_DEFS: ThemeDef[] = [
  {
    id: 'default',
    name: 'Default (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-basic').then((m) => m.basicLight),
  },
  {
    id: 'abcdef',
    name: 'Abcdef (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-abcdef').then((m) => m.abcdef),
  },
  {
    id: 'abyss',
    name: 'Abyss (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-abyss').then((m) => m.abyss),
  },
  {
    id: 'android-studio',
    name: 'Android Studio (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-androidstudio').then((m) => m.androidstudio),
  },
  {
    id: 'andromeda',
    name: 'Andromeda (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-andromeda').then((m) => m.andromeda),
  },
  {
    id: 'atom-one',
    name: 'Atom One (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-atomone').then((m) => m.atomone),
  },
  {
    id: 'aura',
    name: 'Aura (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-aura').then((m) => m.aura),
  },
  {
    id: 'basic-dark',
    name: 'Basic (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-basic').then((m) => m.basicDark),
  },
  {
    id: 'bbedit',
    name: 'BBEdit (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-bbedit').then((m) => m.bbedit),
  },
  {
    id: 'bespin',
    name: 'Bespin (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-bespin').then((m) => m.bespin),
  },
  {
    id: 'console-dark',
    name: 'Console (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-console').then((m) => m.consoleDark),
  },
  {
    id: 'console-light',
    name: 'Console (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-console').then((m) => m.consoleLight),
  },
  {
    id: 'copilot',
    name: 'Copilot (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-copilot').then((m) => m.copilot),
  },
  {
    id: 'darcula',
    name: 'Darcula (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-darcula').then((m) => m.darcula),
  },
  {
    id: 'dracula',
    name: 'Dracula (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-dracula').then((m) => m.dracula),
  },
  {
    id: 'duotone-dark',
    name: 'Duotone (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-duotone').then((m) => m.duotoneDark),
  },
  {
    id: 'duotone-light',
    name: 'Duotone (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-duotone').then((m) => m.duotoneLight),
  },
  {
    id: 'eclipse',
    name: 'Eclipse (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-eclipse').then((m) => m.eclipse),
  },
  {
    id: 'github-dark',
    name: 'GitHub (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-github').then((m) => m.githubDark),
  },
  {
    id: 'github-light',
    name: 'GitHub (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-github').then((m) => m.githubLight),
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-gruvbox-dark').then((m) => m.gruvboxDark),
  },
  {
    id: 'gruvbox-light',
    name: 'Gruvbox (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-gruvbox-dark').then((m) => m.gruvboxLight),
  },
  {
    id: 'kimbie',
    name: 'Kimbie (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-kimbie').then((m) => m.kimbie),
  },
  {
    id: 'material-dark',
    name: 'Material (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-material').then((m) => m.materialDark),
  },
  {
    id: 'material-light',
    name: 'Material (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-material').then((m) => m.materialLight),
  },
  {
    id: 'monokai',
    name: 'Monokai (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-monokai').then((m) => m.monokai),
  },
  {
    id: 'monokai-dimmed',
    name: 'Monokai Dimmed (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-monokai-dimmed').then((m) => m.monokaiDimmed),
  },
  {
    id: 'noctis-lilac',
    name: 'Noctis Lilac (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-noctis-lilac').then((m) => m.noctisLilac),
  },
  {
    id: 'nord',
    name: 'Nord (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-nord').then((m) => m.nord),
  },
  {
    id: 'okaidia',
    name: 'Okaidia (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-okaidia').then((m) => m.okaidia),
  },
  {
    id: 'quiet-light',
    name: 'Quiet Light (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-quietlight').then((m) => m.quietlight),
  },
  { id: 'red', name: 'Red (Dark)', type: 'dark', load: () => import('@uiw/codemirror-theme-red').then((m) => m.red) },
  {
    id: 'solarized-dark',
    name: 'Solarized (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-solarized').then((m) => m.solarizedDark),
  },
  {
    id: 'solarized-light',
    name: 'Solarized (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-solarized').then((m) => m.solarizedLight),
  },
  {
    id: 'sublime',
    name: 'Sublime (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-sublime').then((m) => m.sublime),
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-tokyo-night').then((m) => m.tokyoNight),
  },
  {
    id: 'tokyo-night-day',
    name: 'Tokyo Night Day (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-tokyo-night-day').then((m) => m.tokyoNightDay),
  },
  {
    id: 'tokyo-night-storm',
    name: 'Tokyo Night Storm (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-tokyo-night-storm').then((m) => m.tokyoNightStorm),
  },
  {
    id: 'tomorrow-night-blue',
    name: 'Tomorrow Night Blue (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-tomorrow-night-blue').then((m) => m.tomorrowNightBlue),
  },
  {
    id: 'vscode-dark',
    name: 'VSCode (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-vscode').then((m) => m.vscodeDark),
  },
  {
    id: 'vscode-light',
    name: 'VSCode (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-vscode').then((m) => m.vscodeLight),
  },
  {
    id: 'white-dark',
    name: 'White (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-white').then((m) => m.whiteDark),
  },
  {
    id: 'white-light',
    name: 'White (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-white').then((m) => m.whiteLight),
  },
  {
    id: 'xcode-dark',
    name: 'Xcode (Dark)',
    type: 'dark',
    load: () => import('@uiw/codemirror-theme-xcode').then((m) => m.xcodeDark),
  },
  {
    id: 'xcode-light',
    name: 'Xcode (Light)',
    type: 'light',
    load: () => import('@uiw/codemirror-theme-xcode').then((m) => m.xcodeLight),
  },
];

export const THEMES: Theme[] = THEME_DEFS.map(({ id, name, type }) => ({ id, name, type }));

export const DEFAULT_THEME_ID = 'default';

/**
 * Resolves a theme id to its CodeMirror extension, loading it on demand (falls back to
 * the default theme for an unknown id).
 */
export function getThemeExtension(id: string): Promise<Extension> {
  return (THEME_DEFS.find((theme) => theme.id === id) ?? THEME_DEFS[0]).load();
}

/** Resolves a theme id to its light/dark type (falls back to light). */
export function getThemeType(id: string): ThemeType {
  return THEME_DEFS.find((theme) => theme.id === id)?.type ?? 'light';
}
