import { type BrowserContext, chromium } from 'playwright';
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './config';
import { setMacOsLocale } from './os-locale';
import type { BrowserSession, ScreenshotFixtures } from './types';

/**
 * Finds the Chrome extension ID by inspecting the running background service worker.
 */
export async function getExtensionId(context: BrowserContext): Promise<string> {
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker', { timeout: 10000 });
  }
  const url = background.url();
  const match = /chrome-extension:\/\/([a-z0-9]+)/.exec(url);
  if (!match) {
    throw new Error(`Unable to resolve extension ID from background service worker: ${url}`);
  }
  return match[1];
}

/**
 * Launches Chromium with the MV3 extension loaded and offline route intercepts configured.
 */
export async function createScreenshotSession(
  locale: string,
  extensionPath: string,
  fixtures: ScreenshotFixtures,
): Promise<BrowserSession> {
  setMacOsLocale(locale);

  console.log(`\n🌐 Launching Chromium with extension (Locale: ${locale})...`);
  const isHeadless = process.env.HEADLESS !== 'false';
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    locale,
    viewport: { width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT },
    args: [
      ...(isHeadless ? ['--headless=new'] : []),
      `--lang=${locale}`,
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  // Intercept realistic URLs so tests run completely offline and deterministic
  await context.route('https://raw.githubusercontent.com/**', (route) => {
    const url = route.request().url();
    if (url.endsWith('package.json')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: fixtures.json,
      });
    }
    return route.fulfill({ status: 404, body: 'Not found' });
  });

  await context.route('https://developer.example.com/**', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'text/html; charset=utf-8',
      body: fixtures.html,
    });
  });

  await context.route('https://fonts.gstatic.com/**', (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'font/ttf',
      body: fixtures.font,
    });
  });

  const extensionId = await getExtensionId(context);
  console.log(`🧩 Extension detected with ID: ${extensionId}`);

  const page = await context.newPage();
  await page.setViewportSize({ width: VIEWPORT_WIDTH, height: VIEWPORT_HEIGHT });

  return {
    context,
    extensionId,
    page,
    close: async () => {
      await context.close();
    },
  };
}
