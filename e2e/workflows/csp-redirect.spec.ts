import { expect, test } from '../fixtures';

test.describe('CSP Sandbox Redirect', () => {
  test('CSP sandboxed page redirects to viewer tab', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto('http://localhost:4173/csp-sandboxed.js');

    // The content script detects window.origin === 'null' and redirects the tab
    await page.waitForURL(/viewer\.html/, { timeout: 10_000 });

    expect(page.url()).toContain(extensionId);
    expect(page.url()).toContain('viewer.html');

    // Viewer should render the JS source
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('sandboxed');

    await page.close();
  });
});
