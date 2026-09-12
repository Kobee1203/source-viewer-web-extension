import { execSync } from 'node:child_process';
import { APPLE_LANG_MAP } from './config';

/**
 * On macOS, Chromium derives extension UI translations from AppleLanguages defaults.
 */
export function setMacOsLocale(locale: string): void {
  if (process.platform !== 'darwin') return;
  const appleLang = APPLE_LANG_MAP[locale] || locale;
  try {
    execSync(`defaults write com.google.chrome.for.testing AppleLanguages '("${appleLang}")'`);
  } catch (err) {
    console.warn('⚠️ Warning: Failed to set AppleLanguages via defaults write:', err);
  }
}

/**
 * Resets AppleLanguages default for Chrome for Testing on macOS.
 */
export function clearMacOsLocale(): void {
  if (process.platform !== 'darwin') return;
  try {
    execSync('defaults delete com.google.chrome.for.testing AppleLanguages');
  } catch {}
}
