import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createScreenshotSession } from './screenshots/browser';
import { ALL_LOCALES } from './screenshots/config';
import { clearMacOsLocale } from './screenshots/os-locale';
import { scenarios } from './screenshots/scenarios';
import type { ScreenshotFixtures } from './screenshots/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  const extensionPath = path.resolve('.output/chrome-mv3');
  if (!fs.existsSync(extensionPath)) {
    throw new Error(`Extension build not found at ${extensionPath}. Run "pnpm build" first.`);
  }

  const fixturesDir = path.resolve(__dirname, 'fixtures');
  const fixtures: ScreenshotFixtures = {
    json: fs.readFileSync(path.join(fixturesDir, 'sample.json'), 'utf-8'),
    html: fs.readFileSync(path.join(fixturesDir, 'sample.html'), 'utf-8'),
    font: fs.readFileSync(path.join(fixturesDir, 'sample.ttf')),
  };

  const shouldRunAll = process.argv.includes('--all');
  const targetLocales = shouldRunAll ? ALL_LOCALES : [process.env.LOCALE || 'en'];

  console.log(`🚀 Starting screenshot generation for: ${targetLocales.join(', ')}`);

  try {
    for (const locale of targetLocales) {
      const screenshotsDir = path.resolve('store/screenshots', locale);
      fs.mkdirSync(screenshotsDir, { recursive: true });

      const session = await createScreenshotSession(locale, extensionPath, fixtures);

      try {
        for (let i = 0; i < scenarios.length; i++) {
          const scenario = scenarios[i];
          console.log(`📸 [${locale}] ${i + 1}/${scenarios.length} Capturing ${scenario.name}...`);
          await scenario.run({
            page: session.page,
            extensionId: session.extensionId,
            locale,
            screenshotsDir,
          });
        }
        console.log(`✅ Screenshots for [${locale}] saved to store/screenshots/${locale}/`);
      } finally {
        await session.close();
      }
    }
  } finally {
    clearMacOsLocale();
  }

  console.log('\n🎉 Finished generating all requested store screenshots!');
}

main().catch((err) => {
  console.error('❌ Error generating screenshots:', err);
  clearMacOsLocale();
  process.exit(1);
});
