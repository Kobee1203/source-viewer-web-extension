import { expect, test } from './fixtures';

test('extension loads and background service worker is active', async ({ extensionId }) => {
  expect(extensionId).toMatch(/^[a-z]{32}$/);
});

test('viewer page is accessible', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/viewer.html`);
  await expect(page).toHaveTitle(/Source Code Viewer/);
  await page.close();
});

test('options page is accessible', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await expect(page).toHaveTitle(/Source Code Viewer/);
  await page.close();
});
