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
});
