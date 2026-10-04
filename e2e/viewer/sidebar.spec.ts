import { expect, test } from '../fixtures';

test.describe('Reference Sidebar', () => {
  test('Sidebar opens and displays extracted references', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = encodeURIComponent('http://localhost:4173/source.html');
    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${targetUrl}`);

    await expect(page.locator('.cm-editor')).toBeVisible();

    const toggleBtn = page.locator('button:has(svg.lucide-panel-left)');
    await toggleBtn.click();

    await expect(page.locator('.sidebar-title')).toBeVisible();

    await expect(page.locator('text=styles.css').first()).toBeVisible();
    await expect(page.locator('text=app.js').first()).toBeVisible();
    await expect(page.locator('text=logo.png').first()).toBeVisible();

    await page.close();
  });

  test('Clicking a reference navigates the viewer', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = encodeURIComponent('http://localhost:4173/source.html');
    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${targetUrl}`);

    await expect(page.locator('.cm-editor')).toBeVisible();

    const toggleBtn = page.locator('button:has(svg.lucide-panel-left)');
    await toggleBtn.click();

    await expect(page.locator('.sidebar-title')).toBeVisible();

    const appJsRef = page.locator('text=app.js').first();
    await appJsRef.click();

    // Verify the viewer attempts to navigate by checking the URL change
    await expect(page).toHaveURL(/url=.*app\.js/);

    await page.close();
  });
});
