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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: relative;
          }
          /* Background watermark brackets */
          .watermark {
            position: absolute;
            right: 12px;
            top: 20px;
            font-size: 260px;
            font-family: "JetBrains Mono", Consolas, monospace;
            font-weight: 300;
            color: #00c4e6;
            opacity: 0.05;
            user-select: none;
            pointer-events: none;
            line-height: 1;
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
            image-rendering: auto;
          }
          .title-wrap {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .word-white {
            font-size: 38px;
            font-weight: 800;
            line-height: 1.08;
            letter-spacing: 0.02em;
            color: #ffffff;
            text-transform: uppercase;
          }
          .word-cyan {
            font-size: 38px;
            font-weight: 800;
            line-height: 1.08;
            letter-spacing: 0.02em;
            color: #00c4e6;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="watermark">{</div>
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

    await page.waitForTimeout(300);
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
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            position: relative;
          }
          /* Background watermark brackets & lines */
          .watermark-bracket-left {
            position: absolute;
            left: 580px;
            top: 15px;
            font-size: 520px;
            font-family: "JetBrains Mono", Consolas, monospace;
            font-weight: 300;
            color: #00c4e6;
            opacity: 0.04;
            user-select: none;
            pointer-events: none;
            line-height: 1;
          }
          .watermark-bracket-right {
            position: absolute;
            right: 70px;
            top: 15px;
            font-size: 520px;
            font-family: "JetBrains Mono", Consolas, monospace;
            font-weight: 300;
            color: #00c4e6;
            opacity: 0.04;
            user-select: none;
            pointer-events: none;
            line-height: 1;
          }
          .watermark-lines {
            position: absolute;
            right: 140px;
            top: 155px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            opacity: 0.045;
            pointer-events: none;
          }
          .code-line {
            height: 12px;
            background: #00c4e6;
            border-radius: 6px;
          }
          .container {
            display: flex;
            align-items: center;
            gap: 60px;
            padding: 0 110px;
            z-index: 1;
            width: 100%;
          }
          .icon-wrap {
            flex-shrink: 0;
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
            image-rendering: auto;
          }
          .content-wrap {
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .title-row {
            font-size: 76px;
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: 0.01em;
            color: #ffffff;
            text-transform: uppercase;
          }
          .title-cyan {
            font-size: 76px;
            font-weight: 800;
            line-height: 1.05;
            letter-spacing: 0.01em;
            color: #00c4e6;
            text-transform: uppercase;
            margin-bottom: 22px;
          }
          .subtitle {
            font-size: 26px;
            font-weight: 400;
            color: #94a3b8;
            letter-spacing: -0.01em;
          }
        </style>
      </head>
      <body>
        <div class="watermark-bracket-left">{</div>
        <div class="watermark-bracket-right">}</div>
        <div class="watermark-lines">
          <div class="code-line" style="width: 220px;"></div>
          <div class="code-line" style="width: 340px;"></div>
          <div class="code-line" style="width: 180px;"></div>
          <div class="code-line" style="width: 280px;"></div>
          <div class="code-line" style="width: 240px;"></div>
          <div class="code-line" style="width: 140px;"></div>
        </div>
        <div class="container">
          <div class="icon-wrap">
            <img src="${iconBase64}" alt="Icon" />
          </div>
          <div class="content-wrap">
            <div class="title-row">SOURCE CODE</div>
            <div class="title-cyan">VIEWER</div>
            <div class="subtitle">View formatted, highlighted page source</div>
          </div>
        </div>
      </body>
      </html>
    `);

    await page.waitForTimeout(300);
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
