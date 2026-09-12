import { MOCK_URLS, TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const fontViewerPreviewScenario: VideoScenario = {
  id: '09-font-viewer-preview',
  name: 'Font Viewer: Live Typing & Glyph Grid',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '🔤',
      title: 'Dedicated Web Font Viewer',
      description: 'Test any web font in real-time with your own custom text and inspect all glyphs',
    });

    const fontViewerUrl = `chrome-extension://${ctx.extensionId}/fontviewer.html?url=${encodeURIComponent(MOCK_URLS.font)}`;
    await ctx.page.goto(fontViewerUrl);

    const previewInput = ctx.page.locator('input.preview-input');
    await previewInput.waitFor({ state: 'visible', timeout: 8000 });
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Smoothly type custom sample text into the preview input
    await ctx.smoothClick(previewInput);
    await previewInput.fill('');
    await ctx.smoothType(previewInput, 'Typography Matters! Modern Web Font 2026', 60);

    await ctx.sleep(TIMINGS.scenePauseMs + 400);

    // Switch to Glyphs view
    const glyphsTabBtn = ctx.page.locator('button:has(.lucide-layout-grid)');
    await ctx.smoothClick(glyphsTabBtn);

    const glyphCell = ctx.page.locator('.glyph-cell').nth(15);
    await glyphCell.waitFor({ state: 'visible', timeout: 5000 });
    await ctx.sleep(800);

    // Click a glyph to copy it (triggers toast)
    await ctx.smoothClick(glyphCell);
    await ctx.sleep(TIMINGS.scenePauseMs);
  },
};
