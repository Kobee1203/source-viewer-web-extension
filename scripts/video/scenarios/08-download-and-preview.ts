import fs from 'node:fs';
import path from 'node:path';
import { TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const downloadAndPreviewScenario: VideoScenario = {
  id: '08-download-and-preview',
  name: 'Download & Relative URL Resolution',
  run: async (ctx: VideoContext) => {
    await ctx.showOverlay({
      icon: '💾',
      title: 'Smart Download & Relative URL Resolution',
      description: 'Downloaded HTML injects base origin so stylesheets, images, and fonts render locally',
    });

    const downloadButton = ctx.page.locator('button[title="Download"], button[aria-label="Download"]').first();
    const downloadPromise = ctx.page.waitForEvent('download');

    await ctx.smoothClick(downloadButton);
    const download = await downloadPromise;

    const tempDir = path.resolve('store/video/temp');
    fs.mkdirSync(tempDir, { recursive: true });
    const downloadedFilePath = path.join(tempDir, 'downloaded-page.html');
    await download.saveAs(downloadedFilePath);

    await ctx.sleep(TIMINGS.scenePauseMs);

    // Open the downloaded file in the browser to showcase local rendering!
    await ctx.page.goto(`file://${downloadedFilePath}`);
    await ctx.page.waitForSelector('header.site-header, body', { state: 'visible' });

    await ctx.showOverlay({
      icon: '🌐',
      title: 'Local File Rendering Verified',
      description: 'The downloaded HTML displays perfectly from disk with full styling and assets',
    });

    await ctx.sleep(800);
    await ctx.smoothMoveTo('header.site-header', 800);
    await ctx.sleep(TIMINGS.scenePauseMs + 600);

    // Clean up temporary file
    try {
      fs.unlinkSync(downloadedFilePath);
      fs.rmdirSync(tempDir);
    } catch {
      // ignore
    }
  },
};
