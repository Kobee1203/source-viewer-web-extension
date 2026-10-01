import { type BrowserContext, test as base, chromium } from '@playwright/test';
import path from 'node:path';

/** Absolute path to the built Chrome MV3 extension directory */
const EXTENSION_PATH = path.resolve('.output/chrome-mv3');

/**
 * Custom Playwright fixtures that launch Chromium with the extension loaded
 * and expose the dynamic extension ID to every test.
 *
 * Usage in test files:
 * ```ts
 * import { expect, test } from './fixtures';
 *
 * test('example', async ({ context, extensionId }) => { ... });
 * ```
 */
export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const isHeadless = process.env.HEADLESS !== 'false';
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        ...(isHeadless ? ['--headless=new'] : []),
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
      ],
    });
    await use(context);
    await context.close();
  },

  extensionId: async ({ context }, use) => {
    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker', {
        timeout: 10_000,
      });
    }
    const url = background.url();
    const match = /chrome-extension:\/\/([a-z0-9]+)/.exec(url);
    if (!match) {
      throw new Error(`Unable to resolve extension ID from background service worker: ${url}`);
    }
    await use(match[1]);
  },
});

export { expect } from '@playwright/test';
