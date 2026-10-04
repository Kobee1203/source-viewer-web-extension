import { expect, test } from '../fixtures';

interface ChromeStorage {
  storage: {
    local: {
      get: (keys: string[]) => Promise<Record<string, unknown>>;
      set: (items: Record<string, unknown>) => Promise<void>;
    };
  };
}

test.describe('Settings', () => {
  test('Settings are persisted in storage', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options.html`);

    // Change settings via UI
    await page.locator('#setting-theme').selectOption('eclipse');
    await page.locator('#setting-font-size').selectOption('20');
    await page.locator('#setting-word-wrap').check();

    // Wait for async storage persistence (watchers fire on next tick)
    await page.waitForTimeout(1000);

    // Verify values persisted in browser.storage.local
    // Storage keys: 'theme' (string), 'codeFontSize' (number), 'wordWrap' (boolean)
    const sw = context.serviceWorkers()[0]!;
    const result = await sw.evaluate(() => {
      const c = (globalThis as unknown as { chrome: ChromeStorage }).chrome;
      return c.storage.local.get(['theme', 'codeFontSize', 'wordWrap']);
    });

    expect(result.theme).toBe('eclipse');
    expect(result.codeFontSize).toBe(20);
    expect(result.wordWrap).toBe(true);

    await page.close();
  });

  test('Settings are applied in the viewer after changing options', async ({ context, extensionId }) => {
    // Seed storage values via service worker (same keys the composable reads)
    const sw = context.serviceWorkers()[0]!;
    await sw.evaluate(() => {
      const c = (globalThis as unknown as { chrome: ChromeStorage }).chrome;
      return c.storage.local.set({
        theme: 'eclipse',
        codeFontSize: 20,
        wordWrap: true,
      });
    });

    const page = await context.newPage();
    const targetUrl = encodeURIComponent('http://localhost:4173/source.json');
    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${targetUrl}`);

    await expect(page.locator('.cm-editor')).toBeVisible();

    // Viewer should reflect the stored preferences
    await expect(page.locator('#theme-selector')).toHaveValue('eclipse');
    await expect(page.locator('#font-size-selector')).toHaveValue('20');
    await expect(page.locator('.cm-lineWrapping')).toBeVisible();

    await page.close();
  });
});
