import { expect, test } from '../fixtures';

test.describe('In-Place Interception', () => {
  test('Injects in-place viewer iframe on raw JS navigation', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:4173/source.js');

    // Wait for the in-place iframe to be injected by the content script
    const iframe = page.locator('#source-viewer-frame');
    await expect(iframe).toBeVisible({ timeout: 10_000 });

    // Host page root should be hidden
    await expect(page.locator(':root')).toHaveCSS('visibility', 'hidden');

    // Assert CodeMirror renders inside the iframe with the JS source
    const frame = page.frameLocator('#source-viewer-frame');
    await expect(frame.locator('.cm-editor')).toBeVisible();
    await expect(frame.locator('.cm-content')).toContainText('function');

    await page.close();
  });

  test('Close button removes iframe and restores host page', async ({ context }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:4173/source.js');

    const iframe = page.locator('#source-viewer-frame');
    await expect(iframe).toBeVisible({ timeout: 10_000 });

    const frame = page.frameLocator('#source-viewer-frame');
    await frame.locator('button:has(svg.lucide-x)').click();

    // Iframe should be removed
    await expect(iframe).not.toBeAttached();

    // Host page should be visible again
    await expect(page.locator(':root')).not.toHaveCSS('visibility', 'hidden');

    await page.close();
  });
});
