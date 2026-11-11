import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET_DIR = '/Users/ndossantos/Developments/workspaces/Kobee1203.github.io/source-viewer-web-extension/medias';
const STORE_PROMO_DIR = path.resolve('store/promo');
const TEMPLATES_DIR = path.resolve('scripts/promo/templates');
const ICON_PNG_PATH = path.resolve('src/public/icon/128.png');

const iconPng = fs.readFileSync(ICON_PNG_PATH);
const iconBase64 = `data:image/png;base64,${iconPng.toString('base64')}`;

function loadTemplate(filename: string): string {
  const templatePath = path.join(TEMPLATES_DIR, filename);
  const rawHtml = fs.readFileSync(templatePath, 'utf-8');
  return rawHtml.replaceAll('{{ICON_DATA_URL}}', iconBase64);
}

async function generatePromoImages(): Promise<void> {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  fs.mkdirSync(STORE_PROMO_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // =========================================================================
    // 1. Small Promo: 440 x 280
    // =========================================================================
    await page.setViewportSize({ width: 440, height: 280 });
    await page.setContent(loadTemplate('small-promo.html'));
    await page.waitForTimeout(400);

    const smallPromoLocal = path.join(STORE_PROMO_DIR, 'small-promo-440x280.png');
    const smallPromoTarget = path.join(TARGET_DIR, 'small-promo-440x280.png');
    await page.screenshot({ path: smallPromoLocal });
    fs.copyFileSync(smallPromoLocal, smallPromoTarget);
    console.log(`✅ Generated small promo image: ${smallPromoTarget}`);

    // =========================================================================
    // 2. Marquee: 1400 x 560
    // =========================================================================
    await page.setViewportSize({ width: 1400, height: 560 });
    await page.setContent(loadTemplate('marquee.html'));
    await page.waitForTimeout(400);

    const marqueeLocal = path.join(STORE_PROMO_DIR, 'marquee-1400x560.png');
    const marqueeTarget = path.join(TARGET_DIR, 'marquee-1400x560.png');
    await page.screenshot({ path: marqueeLocal });
    fs.copyFileSync(marqueeLocal, marqueeTarget);
    console.log(`✅ Generated marquee image: ${marqueeTarget}`);
  } finally {
    await browser.close();
  }
}

generatePromoImages().catch((err) => {
  console.error('Failed to generate promo images:', err);
  process.exit(1);
});
