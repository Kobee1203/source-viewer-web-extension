import { expect, test } from '../fixtures';

test.describe('Font Viewer', () => {
  const FONT_URL = 'http://localhost:4173/font.ttf';

  function viewerUrl(extensionId: string): string {
    return `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(FONT_URL)}`;
  }

  test('Font loads and preview displays', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));

    // Wait for the font preview to be visible
    await expect(page.locator('.font-preview')).toBeVisible();
    await expect(page.locator('.preview-text')).not.toBeEmpty();

    // Code-specific buttons should be hidden in font mode
    await expect(page.locator('button:has(svg.lucide-search)')).not.toBeVisible();
    await expect(page.locator('button:has(svg.lucide-text-wrap)')).not.toBeVisible();

    await page.close();
  });

  test('Switch between Preview and Glyph Grid', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));

    // Wait for font preview and view switch buttons to render
    await expect(page.locator('.font-preview')).toBeVisible();
    const glyphsBtn = page.locator('button:has(svg.lucide-layout-grid)');
    await expect(glyphsBtn).toBeVisible();

    // Switch to Glyph Grid
    await glyphsBtn.click();
    await expect(page.locator('.glyph-grid')).toBeVisible();
    await expect(page.locator('button.glyph-cell').first()).toBeVisible();

    // Switch back to Preview
    const previewBtn = page.locator('button:has(svg.lucide-type)');
    await previewBtn.click();
    await expect(page.locator('.font-preview')).toBeVisible();

    await page.close();
  });

  test('Preview controls update rendering', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));

    await expect(page.locator('.font-preview')).toBeVisible();

    // Change font size via slider
    const sizeSlider = page.locator('input[type="range"]');
    await expect(sizeSlider).toBeVisible();
    await sizeSlider.fill('100');

    // Assert size readout updated
    await expect(page.locator('span.size-value')).toContainText('100px');

    // Toggle bold
    const boldBtn = page.locator('button:has(svg.lucide-bold)');
    await expect(boldBtn).toBeVisible();
    await boldBtn.click();
    await expect(boldBtn).toHaveAttribute('aria-pressed', 'true');

    await page.close();
  });

  test('Glyph click shows copied toast', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));

    // Wait for font to load, then switch to Glyph Grid
    await expect(page.locator('.font-preview')).toBeVisible();
    await page.locator('button:has(svg.lucide-layout-grid)').click();

    const firstCell = page.locator('button.glyph-cell').first();
    await expect(firstCell).toBeVisible();

    // Click first glyph cell — should copy and show toast
    await firstCell.click();

    await expect(page.locator('div.toast[role="status"]')).toBeVisible();

    await page.close();
  });

  test('Status bar shows font format badge', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));

    await expect(page.locator('.font-preview')).toBeVisible();

    const formatBadge = page.locator('.font-format-badge');
    await expect(formatBadge).toBeVisible();
    await expect(formatBadge).toContainText('TTF');

    await page.close();
  });
});
