import path from 'node:path';
import type { ScreenshotScenario } from '../types';

export const settingsOptionsScenario: ScreenshotScenario = {
  id: '06-settings-options',
  name: 'Options & Settings Page',
  run: async ({ page, extensionId, screenshotsDir }) => {
    await page.goto(`chrome-extension://${extensionId}/options.html`);
    await page.waitForSelector('.options-container', { state: 'visible' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(screenshotsDir, '06-settings-options.png') });
  },
};
