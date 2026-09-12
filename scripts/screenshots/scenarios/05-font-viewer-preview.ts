import path from 'node:path';
import { MOCK_URLS } from '../config';
import type { ScreenshotScenario } from '../types';

export const fontViewerPreviewScenario: ScreenshotScenario = {
  id: '05-font-viewer-preview',
  name: 'Dedicated Font Viewer - Typography Preview',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.goto(`chrome-extension://${extensionId}/fontviewer.html?url=${encodeURIComponent(MOCK_URLS.font)}`);
    await page.waitForSelector('#app-fontviewer', { state: 'visible' });
    const previewTab = page.locator('.view-switch button').nth(0);
    if (await previewTab.isVisible()) {
      await previewTab.click();
    }
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '05-font-viewer-preview.png') });
  },
};
