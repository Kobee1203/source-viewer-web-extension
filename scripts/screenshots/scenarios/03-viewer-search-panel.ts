import path from 'node:path';
import { MOCK_URLS } from '../config';
import type { ScreenshotScenario } from '../types';

export const viewerSearchPanelScenario: ScreenshotScenario = {
  id: '03-viewer-search-panel',
  name: 'Code Search Panel with Highlights (Tokyo Night Dark)',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.evaluate(() => {
      localStorage.setItem('viewer-wordWrap', 'false');
      localStorage.setItem('viewer-theme', 'tokyo-night');
      localStorage.setItem('viewer-theme-type', 'dark');
    });

    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(MOCK_URLS.json)}`);
    await page.waitForSelector('.cm-content', { state: 'visible' });
    if (await page.locator('#theme-selector').isVisible()) {
      await page.selectOption('#theme-selector', 'tokyo-night');
    }
    await page.keyboard.press('ControlOrMeta+F');
    const searchInput = page.locator('input[name="search"], .cm-textfield');
    await searchInput.waitFor({ state: 'visible' });
    await searchInput.fill('features');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '03-viewer-search-panel.png') });
  },
};
