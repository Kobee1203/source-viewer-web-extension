import path from 'node:path';
import { MOCK_URLS } from '../config';
import type { ScreenshotScenario } from '../types';

export const viewerHtmlSidebarScenario: ScreenshotScenario = {
  id: '02-viewer-html-sidebar',
  name: 'Code Viewer (HTML with Reference Sidebar)',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.evaluate(() => {
      localStorage.setItem('viewer-wordWrap', 'false');
      localStorage.setItem('viewer-theme', 'github-light');
      localStorage.setItem('viewer-theme-type', 'light');
    });

    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(MOCK_URLS.html)}`);
    await page.waitForSelector('.cm-content', { state: 'visible' });
    if (await page.locator('#theme-selector').isVisible()) {
      await page.selectOption('#theme-selector', 'github-light');
    }

    // Open reference sidebar
    const sidebarToggleBtn = page.locator('.toolbar button').first();
    await sidebarToggleBtn.click();
    await page.waitForSelector('.reference-sidebar', { state: 'visible' });

    // Expand closed folders in the VFS tree so CSS, JS, and RSS references are clearly visible
    await page.waitForTimeout(300);
    for (let i = 0; i < 10; i++) {
      const closedChevron = page.locator('.reference-sidebar button.chevron-btn[aria-expanded="false"]').first();
      if ((await closedChevron.count()) === 0) break;
      try {
        await closedChevron.click({ timeout: 1000 });
        await page.waitForTimeout(100);
      } catch {
        break;
      }
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotsDir, '02-viewer-html-sidebar.png') });
  },
};
