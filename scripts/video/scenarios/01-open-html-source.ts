import { MOCK_URLS, TIMINGS } from '../config';
import { hideRealisticContextMenu, showRealisticContextMenu } from '../cursor';
import type { VideoContext, VideoScenario } from '../types';

export const openHtmlSourceScenario: VideoScenario = {
  id: '01-open-html-source',
  name: 'HTML Source & Context Menu Access',
  run: async (ctx: VideoContext) => {
    // 1. Start on the live web page
    await ctx.page.goto(MOCK_URLS.html);
    await ctx.page.waitForSelector('header.site-header', { state: 'visible' });

    await ctx.showOverlay({
      icon: '🖱️',
      title: 'Quick Access via Context Menu',
      description: 'Right-click any web page to view and format its source code with one click',
    });

    await ctx.sleep(TIMINGS.scenePauseMs);

    // 2. Right-click and show the realistic macOS Chrome context menu
    const targetItemLocator = await showRealisticContextMenu(ctx.page, 480, 140);
    await ctx.sleep(800);

    // 3. Move cursor to "View source with Source Viewer", highlight in macOS blue and click
    await ctx.smoothMoveTo(targetItemLocator);
    await ctx.page.evaluate(() => {
      const item = document.getElementById('__context_menu_target_item__');
      if (item) {
        item.style.background = '#0063e1';
        item.style.color = '#ffffff';
      }
    });
    await ctx.sleep(400);
    await ctx.smoothClick(targetItemLocator);
    await hideRealisticContextMenu(ctx.page);

    // 4. Open the viewer page
    const viewerUrl = `chrome-extension://${ctx.extensionId}/viewer.html?url=${encodeURIComponent(MOCK_URLS.html)}`;
    await ctx.page.goto(viewerUrl);
    await ctx.page.waitForSelector('.cm-content', { state: 'visible', timeout: 10000 });

    await ctx.showOverlay({
      icon: '✨',
      title: 'Beautiful Syntax Highlighting',
      description: 'Clean formatting, line numbers, and colorized source code for any web page',
    });

    // Smoothly wander cursor across the code to simulate reading
    await ctx.sleep(TIMINGS.scenePauseMs);
    await ctx.smoothMoveTo('.cm-line:nth-child(5)', 800);
    await ctx.sleep(800);
    await ctx.smoothMoveTo('.cm-line:nth-child(12)', 800);
    await ctx.sleep(TIMINGS.scenePauseMs);
  },
};
