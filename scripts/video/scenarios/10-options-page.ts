import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const optionsPageScenario: VideoScenario = {
  id: '10-options-page',
  name: 'Extension Options & Settings',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '⚙️',
      title: 'Configurable Preferences',
      description: 'Customize opening behavior (in-place vs new tab), default themes, and display settings',
    });

    const optionsUrl = `chrome-extension://${ctx.extensionId}/options.html`;
    await ctx.page.goto(optionsUrl);
    await ctx.page.waitForSelector('.options-container', { state: 'visible', timeout: 8000 });

    await ctx.sleep(TIMINGS.scenePauseMs);

    // Smoothly explore and change options via animated dropdowns
    const openInSelect = ctx.page.locator('select#setting-open-in');
    await ctx.smoothSelectOption(openInSelect, 'current-tab');
    await ctx.sleep(TIMINGS.scenePauseMs);

    const themeSelect = ctx.page.locator('select#setting-theme');
    if (await themeSelect.isVisible()) {
      await ctx.smoothSelectOption(themeSelect, 'dracula');
      await ctx.sleep(TIMINGS.scenePauseMs);
    }

    await ctx.showOverlay({
      icon: '🚀',
      title: 'Source Viewer & Font Viewer',
      description: 'The ultimate web developer companion — view, format, and inspect effortlessly!',
    });

    await ctx.sleep(TIMINGS.scenePauseMs + 1000);
  },
};
