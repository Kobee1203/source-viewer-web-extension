import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const referenceSidebarScenario: VideoScenario = {
  id: '03-reference-sidebar',
  name: 'Interactive Reference Sidebar & Site Tree',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '🗂️',
      title: 'Interactive Reference Sidebar',
      description: 'Explore external scripts, stylesheets, fonts, and linked assets in a virtual tree',
    });

    const sidebarButton = ctx.page.locator('button[title="References"], button[aria-label="References"]').first();
    await ctx.smoothClick(sidebarButton);

    const sidebar = ctx.page.locator('.reference-sidebar');
    await sidebar.waitFor({ state: 'visible', timeout: 5000 });
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Expand "assets" folder
    const assetsFolder = ctx.page.locator('.reference-sidebar .node-name-btn:has-text("assets")').first();
    if (await assetsFolder.isVisible()) {
      await ctx.smoothClick(assetsFolder);
      await ctx.sleep(600);
    }

    // Expand "css" folder
    const cssFolder = ctx.page.locator('.reference-sidebar .node-name-btn:has-text("css")').first();
    if (await cssFolder.isVisible()) {
      await ctx.smoothClick(cssFolder);
      await ctx.sleep(600);
    }

    // Click "main.css" to inspect and load the stylesheet
    const mainCssFile = ctx.page.locator('.reference-sidebar .node-name-btn:has-text("main.css")').first();
    if (await mainCssFile.isVisible()) {
      await ctx.smoothClick(mainCssFile);
      await ctx.sleep(TIMINGS.scenePauseMs + 600);
    }

    // Return to index.html to keep HTML active for subsequent scenes
    const indexHtmlFile = ctx.page
      .locator(
        '.reference-sidebar .node-name-btn:has-text("index.html"), .reference-sidebar .node-name-btn:has-text("developer.example.com")',
      )
      .first();
    if (await indexHtmlFile.isVisible()) {
      await ctx.smoothClick(indexHtmlFile);
      await ctx.page.waitForSelector('.cm-content', { state: 'visible' });
      await ctx.sleep(TIMINGS.scenePauseMs);
    }

    // Close sidebar to keep workspace clean for following scene
    await ctx.smoothClick(sidebarButton);
    await ctx.sleep(600);
  },
};
