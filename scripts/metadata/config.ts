import path from 'node:path';

export const REFERENCE_LOCALE = 'en';
export const MAX_SUMMARY_LENGTH = 132;
export const TARGET_SUMMARY_LENGTH = 130;

export const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  ja: 'Japanese',
  pt_BR: 'Portuguese (Brazil)',
  pt_PT: 'Portuguese (Portugal)',
  zh_CN: 'Simplified Chinese',
};

export const STORE_METADATA_DIR = path.resolve('store/metadata');
export const SRC_LOCALES_DIR = path.resolve('src/locales');
