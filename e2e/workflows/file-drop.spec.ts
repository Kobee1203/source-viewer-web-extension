import { expect, test } from '../fixtures';

test.describe('File Drop', () => {
  test('Drop single file displays source in viewer', async ({ context, extensionId }) => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/viewer.html`);

    // Wait for the drop zone to appear (empty viewer)
    await expect(page.locator('.drop-zone')).toBeVisible();

    // Simulate a file drop
    await page.evaluate(() => {
      const content = 'const hello = "world";\nconsole.log(hello);';
      const file = new File([content], 'test.js', {
        type: 'text/javascript',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const dropEvent = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      });
      document.getElementById('app')!.dispatchEvent(dropEvent);
    });

    // Editor should appear with the dropped file content
    await expect(page.locator('.cm-editor')).toBeVisible();
    await expect(page.locator('.cm-content')).toContainText('hello');

    // Status bar should show snapshot badge
    const badge = page.locator('.snapshot-badge');
    await expect(badge).toBeVisible();

    await page.close();
  });
});
