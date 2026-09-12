export const VIEWPORT_WIDTH = 1280;
export const VIEWPORT_HEIGHT = 800;

export const ALL_LOCALES = ['en', 'fr', 'de', 'es', 'it', 'ja', 'pt_BR', 'pt_PT', 'zh_CN'] as const;

export type SupportedLocale = (typeof ALL_LOCALES)[number];

export const APPLE_LANG_MAP: Record<string, string> = {
  de: 'de',
  en: 'en',
  es: 'es',
  fr: 'fr',
  it: 'it',
  ja: 'ja',
  pt_BR: 'pt-BR',
  pt_PT: 'pt-PT',
  zh_CN: 'zh-CN',
};

// Standard realistic URLs shown in the viewer address / status bar
export const MOCK_URLS = {
  json: 'https://raw.githubusercontent.com/Kobee1203/source-viewer/main/package.json',
  html: 'https://developer.example.com/index.html',
  font: 'https://fonts.gstatic.com/s/inter/v13/Inter-Regular.ttf',
} as const;
