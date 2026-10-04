import { expect, test } from '../fixtures';

const VIEWER_HTML_URL = 'http://localhost:4173/source.html';

function viewerUrl(extensionId: string): string {
  return `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(VIEWER_HTML_URL)}`;
}

test.describe('Search', () => {
  test('Basic text search finds matches', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Open search via toolbar button
    await page.locator('button:has(svg.lucide-search)').click();

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('item');
    await searchInput.press('Enter');

    // Assert match highlighting exists
    await expect(page.locator('.cm-searchMatch').first()).toBeVisible();

    await page.close();
  });

  test('Case sensitive toggle changes results', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('hello');
    await searchInput.press('Enter');

    // Should find "Hello" (case-insensitive by default)
    await expect(page.locator('.cm-searchMatch').first()).toBeVisible();

    // Toggle case sensitive (first checkbox in search panel: match case)
    const matchCaseCheckbox = page.locator('.custom-search-panel input[type="checkbox"]').nth(0);
    await matchCaseCheckbox.click();
    await searchInput.press('Enter');

    // "hello" (lowercase) should not match "Hello" — 0 matches
    await expect(page.locator('.cm-searchMatch')).toHaveCount(0);

    await page.close();
  });

  test('Regex search', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    // Toggle regex mode (second checkbox in search panel: regexp)
    const regexCheckbox = page.locator('.custom-search-panel input[type="checkbox"]').nth(1);
    await regexCheckbox.click();

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('item');
    await searchInput.press('Enter');

    await expect(page.locator('.cm-searchMatch').first()).toBeVisible();

    await page.close();
  });

  test('Navigate between matches', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('item');
    await searchInput.press('Enter');

    await expect(page.locator('.cm-searchMatch-selected')).toBeVisible();

    // Click next button (first .cm-button in search panel)
    await page.locator('.custom-search-panel button.cm-button').first().click();

    // Selected match should still be visible (moved to next)
    await expect(page.locator('.cm-searchMatch-selected')).toBeVisible();

    await page.close();
  });

  test('CSS Selector search finds results', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    // Change mode to CSS Selector
    const modeSelect = page.locator('select.search-mode-select');
    await expect(modeSelect).toBeVisible();
    await modeSelect.selectOption('css-selector');

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('li.item');
    await searchInput.press('Enter');

    // Assert result count is visible and shows matches
    const countSpan = page.locator('span.search-count');
    await expect(countSpan).toBeVisible();
    await expect(countSpan).toContainText('3');

    // No error indicator should be visible
    await expect(page.locator('span.search-error')).not.toBeVisible();

    await page.close();
  });

  test('Invalid structural query shows error', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    // Change mode to XPath
    const modeSelect = page.locator('select.search-mode-select');
    await modeSelect.selectOption('xpath');

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('///[invalid');
    await searchInput.press('Enter');

    // Assert error indicator is visible
    await expect(page.locator('span.search-error')).toBeVisible();

    await page.close();
  });

  test('JSONPath search finds matches in JSON source', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const jsonUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent('http://localhost:4173/source.json')}`;
    await page.goto(jsonUrl);
    await expect(page.locator('.cm-editor')).toBeVisible();

    await page.locator('button:has(svg.lucide-search)').click();

    // Change mode to JSONPath
    const modeSelect = page.locator('select.search-mode-select');
    await expect(modeSelect).toBeVisible();
    await modeSelect.selectOption('jsonpath');

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await searchInput.fill('$.name');
    await searchInput.press('Enter');

    // Assert result count is visible and shows matches
    const countSpan = page.locator('span.search-count');
    await expect(countSpan).toBeVisible();
    await expect(countSpan).toContainText('1');

    await expect(page.locator('span.search-error')).not.toBeVisible();

    await page.close();
  });

  test('Keyboard shortcuts open and close search panel', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(viewerUrl(extensionId));
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Search panel should not be visible initially
    await expect(page.locator('.custom-search-panel')).not.toBeVisible();

    // Press Cmd+F / Ctrl+F to open search
    await page.keyboard.press('ControlOrMeta+f');

    const searchPanel = page.locator('.custom-search-panel');
    await expect(searchPanel).toBeVisible();

    const searchInput = page.locator('input.cm-textfield[name="search"]');
    await expect(searchInput).toBeFocused();

    // Press Escape to close search
    await page.keyboard.press('Escape');
    await expect(searchPanel).not.toBeVisible();

    await page.close();
  });
});
