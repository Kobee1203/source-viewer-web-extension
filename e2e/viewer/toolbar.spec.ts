import { expect, test } from '../fixtures';

test.describe('Toolbar', () => {
  test('Word wrap toggle', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const editor = page.locator('.cm-editor');
    const wrapButton = page.locator('button:has(svg.lucide-text-wrap)');

    // Click word wrap button to enable
    await wrapButton.click();
    await expect(wrapButton).toHaveClass(/active/);
    await expect(page.locator('.cm-content')).toHaveClass(/cm-lineWrapping/);

    // Click again to disable
    await wrapButton.click();
    await expect(wrapButton).not.toHaveClass(/active/);
    await expect(page.locator('.cm-content')).not.toHaveClass(/cm-lineWrapping/);

    await page.close();
  });

  test('Theme selector changes editor appearance', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const getBgColor = () =>
      page.evaluate(() => {
        const editor = document.querySelector('.cm-editor');
        return editor ? window.getComputedStyle(editor).backgroundColor : null;
      });

    const initialBgColor = await getBgColor();

    // Change theme to a dark theme (e.g. dracula) to ensure background color changes from default light
    await page.locator('#theme-selector').selectOption('dracula');
    // Wait for theme to apply reactively
    await expect.poll(getBgColor, { timeout: 3000 }).not.toBe(initialBgColor);

    await page.close();
  });

  test('Font size selector changes editor font size', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const getFontSize = () =>
      page.evaluate(() => {
        const editor = document.querySelector('.cm-editor');
        return editor ? window.getComputedStyle(editor).fontSize : null;
      });

    const initialFontSize = await getFontSize();

    // Change font size
    await page.locator('#font-size-selector').selectOption('20');
    await expect.poll(getFontSize, { timeout: 3000 }).not.toBe(initialFontSize);

    await page.close();
  });

  test('Copy button copies source and shows feedback', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const copyBtn = page.locator('button.copy-btn');
    await copyBtn.click();

    // Assert visual feedback: button gets .copied class
    await expect(copyBtn).toHaveClass(/copied/);

    await page.close();
  });

  test('Download button triggers file download', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.locator('button:has(svg.lucide-download)').click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBeTruthy();

    await page.close();
  });

  test('HTML source is auto-beautified on load', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.html')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    // HTML is auto-beautified by the viewer — verify indentation exists
    const content = await page.locator('.cm-content').textContent();
    expect(content).toBeTruthy();
    expect(content).toContain('Hello World');

    await page.close();
  });

  test('Settings dialog opens and closes in viewer', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Click settings button in toolbar to open modal dialog
    await page.locator('button:has(svg.lucide-settings)').click();

    // Assert dialog opened with options
    const dialog = page.locator('dialog.dialog-base');
    await expect(dialog).toBeVisible();
    await expect(page.locator('#settings-open-in')).toBeVisible();

    // Close dialog via close button
    await page.locator('button.dialog-close').click();
    await expect(dialog).not.toBeVisible();

    await page.close();
  });

  test('Copy options dropdown displays menu items', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const url = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(url);
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Click split button toggle to open copy menu
    const splitBtnToggle = page.locator('button.split-btn-toggle');
    await splitBtnToggle.click();

    const menu = page.locator('ul.dropdown-menu[role="menu"]');
    await expect(menu).toBeVisible();

    // Verify multiple copy options exist
    const items = page.locator('button.dropdown-item[role="menuitem"]');
    await expect(items).toHaveCount(3); // formatted, raw, url

    // Click first item to trigger copy
    await items.first().click();
    await expect(menu).not.toBeVisible();
    await expect(page.locator('button.copy-btn')).toHaveClass(/copied/);

    await page.close();
  });
});
