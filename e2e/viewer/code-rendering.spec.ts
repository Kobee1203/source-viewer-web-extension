import { expect, test } from '../fixtures';

test.describe('Code Rendering', () => {
  test('Renders HTML with syntax highlighting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = 'http://localhost:4173/source.html';
    const viewerUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(targetUrl)}`;

    await page.goto(viewerUrl);

    // Wait for and assert .cm-editor is visible
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Assert content contains text from the HTML fixture
    await expect(page.locator('.cm-content')).toContainText('Hello World');

    // Assert syntax tokens exist as styled spans inside lines
    await expect(page.locator('.cm-line span').first()).toBeVisible();

    // Assert status bar .page-size is visible and not empty
    const pageSize = page.locator('.page-size');
    await expect(pageSize).toBeVisible();
    await expect(pageSize).not.toBeEmpty();

    await page.close();
  });

  test('Renders CSS with syntax highlighting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = 'http://localhost:4173/source.css';
    const viewerUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(targetUrl)}`;

    await page.goto(viewerUrl);

    // Wait for and assert .cm-editor is visible
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Assert content contains text from the CSS fixture
    await expect(page.locator('.cm-content')).toContainText('--primary-color');

    // Assert syntax tokens exist
    await expect(page.locator('.cm-line span').first()).toBeVisible();

    // Assert status bar .page-size is visible
    const pageSize = page.locator('.page-size');
    await expect(pageSize).toBeVisible();
    await expect(pageSize).not.toBeEmpty();

    await page.close();
  });

  test('Renders JavaScript with syntax highlighting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = 'http://localhost:4173/source.js';
    const viewerUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(targetUrl)}`;

    await page.goto(viewerUrl);

    // Wait for and assert .cm-editor is visible
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Assert content contains text from the JS fixture
    await expect(page.locator('.cm-content')).toContainText('function');

    // Assert syntax tokens exist
    await expect(page.locator('.cm-line span').first()).toBeVisible();

    // Assert status bar .page-size is visible
    const pageSize = page.locator('.page-size');
    await expect(pageSize).toBeVisible();
    await expect(pageSize).not.toBeEmpty();

    await page.close();
  });

  test('Renders JSON with syntax highlighting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = 'http://localhost:4173/source.json';
    const viewerUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(targetUrl)}`;

    await page.goto(viewerUrl);

    // Wait for and assert .cm-editor is visible
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Assert content contains text from the JSON fixture
    await expect(page.locator('.cm-content')).toContainText('source-viewer');

    // Assert syntax tokens exist
    await expect(page.locator('.cm-line span').first()).toBeVisible();

    // Assert status bar .page-size is visible
    const pageSize = page.locator('.page-size');
    await expect(pageSize).toBeVisible();
    await expect(pageSize).not.toBeEmpty();

    // Assert HTTP status
    await expect(page.locator('.http-status.http-success')).toContainText('HTTP 200');

    await page.close();
  });

  test('Renders XML with syntax highlighting', async ({ context, extensionId }) => {
    const page = await context.newPage();
    const targetUrl = 'http://localhost:4173/source.xml';
    const viewerUrl = `chrome-extension://${extensionId}/viewer.html?url=${encodeURIComponent(targetUrl)}`;

    await page.goto(viewerUrl);

    // Wait for and assert .cm-editor is visible
    await expect(page.locator('.cm-editor')).toBeVisible();

    // Assert content contains text from the XML fixture
    await expect(page.locator('.cm-content')).toContainText('catalog');

    // Assert syntax tokens exist
    await expect(page.locator('.cm-line span').first()).toBeVisible();

    // Assert status bar .page-size is visible
    const pageSize = page.locator('.page-size');
    await expect(pageSize).toBeVisible();
    await expect(pageSize).not.toBeEmpty();

    await page.close();
  });
});
