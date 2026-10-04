import { expect, test } from '../fixtures';

interface ChromeTabs {
  tabs: {
    create: (createProperties: { url: string }) => Promise<{ id?: number }>;
  };
}

test.describe('View-Source Interception', () => {
  test('Navigating to view-source: URL redirects to viewer', async ({ context, extensionId }) => {
    const fixtureUrl = 'http://localhost:4173/source.html';

    // In Chrome, opening a view-source: URL causes tabs.onUpdated to fire.
    // The background script intercepts it and redirects the tab to viewer.html.
    const newPagePromise = context.waitForEvent('page');

    const sw = context.serviceWorkers()[0]!;
    await sw.evaluate(async (url) => {
      const c = (globalThis as unknown as { chrome: ChromeTabs }).chrome;
      await c.tabs.create({ url: `view-source:${url}` });
    }, fixtureUrl);

    const page = await newPagePromise;

    // Assert that the tab is redirected to viewer.html
    await page.waitForURL(/viewer\.html/, { timeout: 10_000 });

    expect(page.url()).toContain(extensionId);
    expect(page.url()).toContain('viewer.html');
    expect(page.url()).toContain(encodeURIComponent(fixtureUrl));

    // Assert the viewer renders the source
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('Hello World');

    await page.close();
  });
});
