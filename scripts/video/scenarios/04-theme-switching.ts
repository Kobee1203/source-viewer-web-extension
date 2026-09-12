import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const themeSwitchingScenario: VideoScenario = {
  id: '04-theme-switching',
  name: 'Light & Dark Themes',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '🎨',
      title: 'Dozens of Themes',
      description: 'Switch effortlessly between popular dark and light themes to suit your style',
    });

    const themeSelect = ctx.page.locator('select#theme-selector');

    // Switch to Light Theme (GitHub Light)
    await ctx.smoothSelectOption(themeSelect, 'github-light');
    await ctx.sleep(TIMINGS.scenePauseMs + 400);

    // Switch to Dracula
    await ctx.smoothSelectOption(themeSelect, 'dracula');
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Switch to Monokai Dimmed
    await ctx.smoothSelectOption(themeSelect, 'monokai-dimmed');
    await ctx.sleep(TIMINGS.scenePauseMs);
  },
};
