import { expect, test } from '../fixtures';

test.describe('Error Views', () => {
  test('HTTP 404 shows error view', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = encodeURIComponent('http://localhost:4173/error-404');
    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${targetUrl}`);

    // The viewer fetches the URL, receives 404, and shows the error status
    const errorStatus = page.locator('.http-status.http-error');
    await expect(errorStatus).toBeVisible();
    await expect(errorStatus).toContainText('404');

    await page.close();
  });

  test('File access denied shows help instructions', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = encodeURIComponent('file:///test.js');
    await page.goto(`chrome-extension://${extensionId}/viewer.html?url=${targetUrl}&fileAccess=0`);

    // File access denied card with instructions should be visible
    await expect(page.locator('.file-help-card')).toBeVisible();

    // Drop zone fallback should also be visible
    await expect(page.locator('.drop-zone')).toBeVisible();

    await page.close();
  });
});
