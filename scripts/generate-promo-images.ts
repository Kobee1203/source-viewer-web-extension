import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const TARGET_DIR = '/Users/ndossantos/Developments/workspaces/Kobee1203.github.io/source-viewer-web-extension/medias';
const STORE_PROMO_DIR = path.resolve('store/promo');
const ICON_PNG_PATH = path.resolve('src/public/icon/128.png');

const iconPng = fs.readFileSync(ICON_PNG_PATH);
const iconBase64 = `data:image/png;base64,${iconPng.toString('base64')}`;

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
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 440px;
            height: 280px;
            overflow: hidden;
            background: radial-gradient(circle at 75% 45%, #0b1a2d 0%, #050a12 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, Helvetica, sans-serif;
            position: relative;
          }
          /* Background Lucide bracket */
          .b-left {
            position: absolute;
            left: 240px;
            top: 10px;
            width: 140px;
            height: 260px;
            pointer-events: none;
          }
          .container {
            display: flex;
            align-items: center;
            gap: 28px;
            padding: 0 32px;
            z-index: 1;
            width: 100%;
          }
          .icon-wrap {
            flex-shrink: 0;
            width: 140px;
            height: 140px;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 14px 28px rgba(0, 0, 0, 0.65);
          }
          .icon-wrap img {
            width: 100%;
            height: 100%;
            display: block;
          }
          .title-wrap {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .word-white {
            font-size: 38px;
            font-weight: bold;
            line-height: 1.08;
            letter-spacing: 0.02em;
            color: #ffffff;
            text-transform: uppercase;
          }
          .word-cyan {
            font-size: 38px;
            font-weight: bold;
            line-height: 1.08;
            letter-spacing: 0.02em;
            color: #00c4e6;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <svg class="b-left" viewBox="1 3 7 18" preserveAspectRatio="none" fill="none" stroke="#00c4e6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.08">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
        </svg>
        <div class="container">
          <div class="icon-wrap">
            <img src="${iconBase64}" alt="Icon" />
          </div>
          <div class="title-wrap">
            <div class="word-white">SOURCE</div>
            <div class="word-white">CODE</div>
            <div class="word-cyan">VIEWER</div>
          </div>
        </div>
      </body>
      </html>
    `);

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
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            width: 1400px;
            height: 560px;
            overflow: hidden;
            background: radial-gradient(circle at 65% 50%, #0d223a 0%, #050a12 100%);
            position: relative;
            font-family: Arial, Helvetica, sans-serif;
          }
          /* Background Lucide brackets */
          .brace-left {
            position: absolute;
            left: 495px;
            top: 89px;
            width: 260px;
            height: 440px;
            pointer-events: none;
          }
          .brace-right {
            position: absolute;
            right: 36px;
            top: 89px;
            width: 260px;
            height: 440px;
            pointer-events: none;
          }
          /* Horizontal code lines */
          .code-lines {
            position: absolute;
            inset: 0;
            pointer-events: none;
          }
          .code-line {
            position: absolute;
            height: 14px;
            border-radius: 7px;
            background: #00c4e6;
          }
          .icon-wrap {
            position: absolute;
            left: 115px;
            top: 145px;
            width: 260px;
            height: 260px;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 20px 48px rgba(0, 0, 0, 0.7);
          }
          .icon-wrap img {
            width: 100%;
            height: 100%;
            display: block;
          }
          .text-wrap {
            position: absolute;
            left: 474px;
            top: 171px;
          }
          .title-row {
            font-size: 84px;
            font-weight: bold;
            line-height: 1.0;
            color: #ffffff;
            letter-spacing: 0;
          }
          .title-cyan {
            font-size: 84px;
            font-weight: bold;
            line-height: 1.0;
            color: #00c4e6;
            margin-top: 12px;
            letter-spacing: 0;
          }
          .subtitle {
            font-size: 27px;
            font-weight: normal;
            color: #94a3b8;
            margin-top: 36px;
            letter-spacing: 0;
          }
        </style>
      </head>
      <body>
        <svg class="brace-left" viewBox="1 3 7 18" preserveAspectRatio="none" fill="none" stroke="#00c4e6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.08">
          <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1" />
        </svg>
        <svg class="brace-right" viewBox="16 3 7 18" preserveAspectRatio="none" fill="none" stroke="#00c4e6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity="0.08">
          <path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1" />
        </svg>
        <div class="code-lines">
          <div class="code-line" style="top: 150px; left: 1000px; width: 220px; opacity: 0.08;"></div>
          <div class="code-line" style="top: 187px; left: 1000px; width: 160px; opacity: 0.04;"></div>
          <div class="code-line" style="top: 228px; left: 950px; width: 350px; opacity: 0.08;"></div>
          <div class="code-line" style="top: 276px; left: 1050px; width: 240px; opacity: 0.06;"></div>
          <div class="code-line" style="top: 297px; left: 990px; width: 180px; opacity: 0.05;"></div>
          <div class="code-line" style="top: 317px; left: 990px; width: 250px; opacity: 0.06;"></div>
          <div class="code-line" style="top: 359px; left: 1050px; width: 320px; opacity: 0.08;"></div>
          <div class="code-line" style="top: 401px; left: 1050px; width: 160px; opacity: 0.05;"></div>
        </div>
        <div class="icon-wrap">
          <img src="${iconBase64}" alt="Icon" />
        </div>
        <div class="text-wrap">
          <div class="title-row">SOURCE CODE</div>
          <div class="title-cyan">VIEWER</div>
          <div class="subtitle">View formatted, highlighted page source</div>
        </div>
      </body>
      </html>
    `);

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
