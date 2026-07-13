import { browser } from 'wxt/browser';

// WXT types getMessage's key against the known message keys; we accept a plain
// string here (this wrapper is replaced by @wxt-dev/i18n in step 2).
const getMessage = browser.i18n.getMessage as (
  key: string,
  substitutions?: string | string[],
) => string;

/** Thin wrapper around browser.i18n.getMessage (replaced by @wxt-dev/i18n in step 2). */
export function t(key: string, substitutions?: string | string[]): string {
  return getMessage(key, substitutions);
}
