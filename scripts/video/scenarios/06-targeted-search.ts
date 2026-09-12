import { MOCK_URLS, TIMINGS } from '../config';
import type { VideoContext, VideoScenario } from '../types';

export const targetedSearchScenario: VideoScenario = {
  id: '06-targeted-search',
  name: 'Targeted Search: Full-Text, CSS Selectors & XPath',
  run: async (ctx: VideoContext) => {
    // Ensure we are on the HTML source so structural search modes (CSS Selector, XPath) are available
    if (!ctx.page.url().includes('index.html')) {
      const viewerUrl = `chrome-extension://${ctx.extensionId}/viewer.html?url=${encodeURIComponent(MOCK_URLS.html)}`;
      await ctx.page.goto(viewerUrl);
      await ctx.page.waitForSelector('.cm-content', { state: 'visible', timeout: 10000 });
    }

    await ctx.showOverlay({
      icon: '🔎',
      title: 'Targeted & Structural Search',
      description: 'Search across the full source with regex, XPath, CSS Selectors, and JSONPath',
    });

    const searchButton = ctx.page.locator('button[title="Search"], button[aria-label="Search"]').first();
    await ctx.smoothClick(searchButton);

    const searchInput = ctx.page.locator('input[name="search"]');
    await searchInput.waitFor({ state: 'visible', timeout: 5000 });

    // 1. Text search for "stylesheet"
    await ctx.smoothType(searchInput, 'stylesheet');
    await ctx.sleep(TIMINGS.scenePauseMs);

    // 2. Switch mode to CSS Selector
    const modeSelect = ctx.page.locator('select.search-mode-select');
    await ctx.smoothSelectOption(modeSelect, 'css-selector');
    await ctx.sleep(600);

    // 3. Clear and search for "nav a"
    await searchInput.fill('');
    await ctx.smoothType(searchInput, 'nav a');
    await ctx.sleep(TIMINGS.scenePauseMs);

    // Navigate to next match
    const nextBtn = ctx.page
      .locator('.custom-search-panel button:has-text("Next"), .custom-search-panel button:has-text("next")')
      .first();
    if (await nextBtn.isVisible()) {
      await ctx.smoothClick(nextBtn);
      await ctx.sleep(600);
      await ctx.smoothClick(nextBtn);
      await ctx.sleep(600);
    }

    await ctx.sleep(TIMINGS.scenePauseMs);

    // Close search panel cleanly via the close button
    const closeBtn = ctx.page.locator('.custom-search-panel button[name="close"]');
    if (await closeBtn.isVisible()) {
      await ctx.smoothClick(closeBtn);
    } else {
      await ctx.page.keyboard.press('Escape');
    }

    await ctx.sleep(TIMINGS.scenePauseMs);
  },
};
