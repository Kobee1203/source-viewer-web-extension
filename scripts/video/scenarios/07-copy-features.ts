import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const copyFeaturesScenario: VideoScenario = {
  id: '07-copy-features',
  name: 'Quick-Copy Split Button',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '📋',
      title: 'Quick Copy with Instant Feedback',
      description: 'One-click copy for formatted code, or dropdown to copy raw source & URL',
    });

    // 1. One-click copy formatted code
    const mainCopyBtn = ctx.page.locator('button.copy-btn, button[title="Copy formatted source"]').first();
    await ctx.smoothClick(mainCopyBtn);
    await ctx.sleep(TIMINGS.scenePauseMs);

    // 2. Open dropdown to reveal additional copy options
    const dropdownToggle = ctx.page.locator('button.split-btn-toggle, button[title="More copy options"]').first();
    await ctx.smoothClick(dropdownToggle);

    const menu = ctx.page.locator('.dropdown-menu');
    await menu.waitFor({ state: 'visible', timeout: 3000 });
    await ctx.sleep(800);

    // Move cursor over dropdown options
    const items = ctx.page.locator('button.dropdown-item');
    if ((await items.count()) >= 2) {
      await ctx.smoothMoveTo(items.nth(1), 500);
      await ctx.sleep(600);
      await ctx.smoothClick(items.nth(1)); // Copy raw source or URL
    }

    await ctx.sleep(TIMINGS.scenePauseMs);
  },
};
