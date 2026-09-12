import path from 'node:path';
import { MOCK_URLS } from '../config';
import type { ScreenshotScenario } from '../types';

export const fontViewerGlyphsScenario: ScreenshotScenario = {
  id: '04-font-viewer-glyphs',
  name: 'Dedicated Font Viewer - Glyphs Grid',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.goto(`chrome-extension://${extensionId}/fontviewer.html?url=${encodeURIComponent(MOCK_URLS.font)}`);
    await page.waitForSelector('#app-fontviewer', { state: 'visible' });
    const glyphsTab = page.locator('.view-switch button').nth(1);
    if (await glyphsTab.isVisible()) {
      await glyphsTab.click();
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '04-font-viewer-glyphs.png') });
  },
};
