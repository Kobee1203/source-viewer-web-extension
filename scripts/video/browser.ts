import fs from 'node:fs';
import { type BrowserContext, chromium } from 'playwright';
import { getExtensionId } from '../screenshots/browser';
import { setMacOsLocale } from '../screenshots/os-locale';
import type { ScreenshotFixtures } from '../screenshots/types';
import { RAW_VIDEO_DIR, VIDEO_HEIGHT, VIDEO_WIDTH } from './config';
import type { VideoSession } from './types';

export async function createVideoSession(extensionPath: string, fixtures: ScreenshotFixtures): Promise<VideoSession> {
  // Demo video is in English
  setMacOsLocale('en');

  fs.mkdirSync(RAW_VIDEO_DIR, { recursive: true });

  console.log(`\n🎬 Launching Chromium with video recording enabled (${VIDEO_WIDTH}x${VIDEO_HEIGHT})...`);
  const isHeadless = process.env.HEADLESS !== 'false';

  const context: BrowserContext = await chromium.launchPersistentContext('', {
    headless: false,
    locale: 'en',
    viewport: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
    recordVideo: {
      dir: RAW_VIDEO_DIR,
      size: { width: VIDEO_WIDTH, height: VIDEO_HEIGHT },
    },
    args: [
      ...(isHeadless ? ['--headless=new'] : []),
      '--lang=en',
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
  });

  await context.addInitScript(() => {
    (window as unknown as { __name?: unknown }).__name = (target: unknown) => target;
  });

  // Intercept realistic URLs and their linked subresources
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
    const url = route.request().url();

    if (url.endsWith('index.html') || url.endsWith('/')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: fixtures.html,
      });
    }

    if (url.endsWith('.css')) {
      return route.fulfill({
        status: 200,
        contentType: 'text/css; charset=utf-8',
        body: `
          body { font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; padding: 2rem; }
          .site-header { border-bottom: 1px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
          .logo { font-size: 1.5rem; font-weight: bold; color: #38bdf8; text-decoration: none; }
          .nav-links { display: flex; gap: 1.5rem; list-style: none; margin-top: 1rem; padding: 0; }
          .nav-links a { color: #94a3b8; text-decoration: none; font-weight: 500; }
          .nav-links a:hover { color: #38bdf8; }
          .hero { background: #1e293b; border-radius: 12px; padding: 2.5rem; border: 1px solid #334155; }
          .hero h1 { font-size: 2rem; margin-bottom: 1rem; color: #f8fafc; }
          .hero p { color: #cbd5e1; font-size: 1.1rem; line-height: 1.6; }
        `,
      });
    }

    if (url.endsWith('.js')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/javascript; charset=utf-8',
        body: 'console.log("Subresource loaded successfully");',
      });
    }

    if (url.endsWith('.xml')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/rss+xml; charset=utf-8',
        body: '<rss version="2.0"><channel><title>Updates</title></channel></rss>',
      });
    }

    return route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'OK',
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
  await page.setViewportSize({ width: VIDEO_WIDTH, height: VIDEO_HEIGHT });

  return {
    context,
    page,
    extensionId,
    videoDir: RAW_VIDEO_DIR,
    close: async () => {
      const video = page.video();
      const videoPathPromise = video ? video.path() : Promise.resolve(null);
      await page.close();
      await context.close();
      return videoPathPromise;
    },
  };
}
