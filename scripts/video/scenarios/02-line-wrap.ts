import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const lineWrapScenario: VideoScenario = {
  id: '02-line-wrap',
  name: 'Line Wrap & Code Folding',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '↩️',
      title: 'Word Wrap & Formatting',
      description: 'Toggle word wrap on and off with a single click to inspect long lines easily',
    });

    // Focus cursor near the long meta line in the center of the viewport
    await ctx.smoothMoveTo('.cm-line:nth-child(9)', 600);
    await ctx.sleep(500);

    const wrapButton = ctx.page.locator('button[title="Line wrap"], button[aria-label="Line wrap"]').first();
    await ctx.smoothClick(wrapButton);
    await ctx.sleep(TIMINGS.scenePauseMs + 600);

    // Click again to show unwrapping back to single long line
    await ctx.smoothClick(wrapButton);
    await ctx.sleep(TIMINGS.scenePauseMs + 400);

    // Keep it wrapped for convenient viewing
    await ctx.smoothClick(wrapButton);
    await ctx.sleep(800);
  },
};
