import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const fontSizeScenario: VideoScenario = {
  id: '05-font-size',
  name: 'Font Size Adjustment',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '🔎',
      title: 'Adjustable Font Size',
      description: 'Scale the editor font size instantly for comfortable reading on any display',
    });

    const fontSelect = ctx.page.locator('select#font-size-selector');

    // Increase font size to 16px
    await ctx.smoothSelectOption(fontSelect, '16');
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Increase font size to 18px
    await ctx.smoothSelectOption(fontSelect, '18');
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Set back to a balanced 14px
    await ctx.smoothSelectOption(fontSelect, '14');
    await ctx.sleep(800);
  },
};
