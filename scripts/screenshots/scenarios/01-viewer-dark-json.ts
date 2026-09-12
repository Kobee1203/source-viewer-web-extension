import path from 'node:path';
import { MOCK_URLS } from '../config';
import type { ScreenshotScenario } from '../types';

export const viewerDarkJsonScenario: ScreenshotScenario = {
  id: '01-viewer-dark-json',
  name: 'Code Viewer (Dark / Dracula - JSON with Line Wrap & Collapsing)',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.addInitScript(() => {
      localStorage.setItem('viewer-wordWrap', 'true');
      localStorage.setItem('viewer-theme', 'dracula');
      localStorage.setItem('viewer-theme-type', 'dark');
    });

    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(MOCK_URLS.json)}`);
    await page.waitForSelector('.cm-content', { state: 'visible' });
    await page.waitForSelector('.cm-lineWrapping', { state: 'attached' });

    // Collapse nodes in the JSON structure to showcase folding markers
    const foldMarkers = page.locator('.cm-foldGutter span[title="Fold line"]');
    const markerCount = await foldMarkers.count();
    if (markerCount > 2) {
      // Fold "keywords" node
      await foldMarkers.nth(1).click();
      await page.waitForTimeout(200);
      // Fold another node
      await foldMarkers.nth(2).click();
      await page.waitForTimeout(200);
    }
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '01-viewer-dark-json.png') });
  },
};
