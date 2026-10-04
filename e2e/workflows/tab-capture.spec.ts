import { expect, test } from '../fixtures';

interface ChromeTabs {
  tabs: {
    query: (queryInfo: { url: string }) => Promise<Array<{ url?: string }>>;
    create: (createProperties: { url: string }) => Promise<unknown>;
  };
  runtime: {
    getURL: (path: string) => string;
  };
}

test.describe('Tab Capture', () => {
  test('Simulated toolbar icon opens viewer with captured source', async ({ context }) => {
    // Navigate a tab to the target page
    const targetPage = await context.newPage();
    const targetUrl = 'http://localhost:4173/page-for-capture.html';
    await targetPage.goto(targetUrl);

    // Simulate toolbar icon click via the background service worker:
    // queries the target tab and opens a new viewer tab for it
    const newPagePromise = context.waitForEvent('page');

    const sw = context.serviceWorkers()[0]!;
    await sw.evaluate(async (url) => {
      const c = (globalThis as unknown as { chrome: ChromeTabs }).chrome;
      const [tab] = await c.tabs.query({ url });
      await c.tabs.create({
        url: c.runtime.getURL('/viewer.html') + '?url=' + encodeURIComponent(tab?.url || url),
      });
    }, targetUrl);

    // Wait for the new viewer tab to open
    const viewerPage = await newPagePromise;

    // Verify viewer displays the source of the captured tab
    await expect(viewerPage.locator('.cm-editor')).toBeVisible();
    await expect(viewerPage.locator('.cm-content')).toContainText('Page to Capture');

    await viewerPage.close();
    await targetPage.close();
  });
});
