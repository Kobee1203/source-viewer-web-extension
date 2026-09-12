import fs from 'node:fs';
import { computeReferenceHash, loadChecksums, saveChecksums } from './metadata/checksums';
import { REFERENCE_LOCALE } from './metadata/config';
import { readReferenceMetadata, saveMetadata, translateMetadata } from './metadata/translator';
import type { TranslationOptions } from './metadata/types';
import { getAvailableLocales, validateLocaleMetadata } from './metadata/validator';

function loadEnvironment(): void {
  const envPath = '.env';
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile(envPath);
    } catch (err) {
      console.warn(`⚠️ Warning: could not load ${envPath}:`, err instanceof Error ? err.message : err);
    }
  }
}

function printHelp(): void {
  console.log(`
Usage: tsx scripts/sync-store-descriptions.ts [options]

Options:
  --all                 Synchronize all non-English locales
  --locale=<locale>     Synchronize a specific locale (e.g. --locale=fr)
  --locales=<l1,l2,...> Synchronize a comma-separated list of locales
  --force               Force re-translation even if English reference hasn't changed
  --help                Show this help message

Environment variables for AI translation (can be defined in .env or shell):
  GEMINI_API_KEY (or GOOGLE_API_KEY)  Use Google Gemini (model via GEMINI_MODEL, default: gemini-3.6-flash)
  OPENAI_API_KEY                      Use OpenAI (model via OPENAI_MODEL, default: gpt-4o-mini)
`);
}

async function main(): Promise<void> {
  loadEnvironment();

  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const isForce = args.includes('--force');
  const allAvailable = getAvailableLocales().filter((l) => l !== REFERENCE_LOCALE);
  let targetLocales: string[] = [];

  const localeArg = args.find((a) => a.startsWith('--locale='));
  const localesArg = args.find((a) => a.startsWith('--locales='));

  if (args.includes('--all')) {
    targetLocales = allAvailable;
  } else if (localeArg) {
    targetLocales = [localeArg.split('=')[1]];
  } else if (localesArg) {
    targetLocales = localesArg
      .split('=')[1]
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (targetLocales.length === 0) {
    targetLocales = allAvailable;
  }

  const reference = readReferenceMetadata();
  const currentHash = computeReferenceHash(reference);
  const checksums = loadChecksums();

  // Filter locales that actually need translation unless --force is specified
  const localesToTranslate = targetLocales.filter((locale) => {
    if (isForce) return true;
    const isUpToDate = checksums.locales[locale] === currentHash;
    const check = validateLocaleMetadata(locale);
    return !isUpToDate || !check.valid;
  });

  const upToDateLocales = targetLocales.filter((locale) => !localesToTranslate.includes(locale));

  if (localesToTranslate.length === 0) {
    console.log(`✨ All ${targetLocales.length} target locale(s) are already up to date with English reference.`);
    console.log('   (Hash:', currentHash.slice(0, 12) + '...)');
    console.log('   Use --force to regenerate anyway.\n');
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const apiKey = geminiKey || openAiKey;

  if (!apiKey) {
    console.error('⚠️ No translation API key detected!');
    console.error('\nTo translate and synchronize store metadata using AI:');
    console.error('  1. Add your key to a .env file (recommended):');
    console.error('       echo "GEMINI_API_KEY=your-gemini-key" >> .env');
    console.error('  2. Or export it in your shell:');
    console.error('       export GEMINI_API_KEY="your-gemini-key"');
    console.error('\nTo check existing metadata without an API key, run:');
    console.error('  pnpm metadata:check\n');
    process.exit(1);
  }

  const provider: 'gemini' | 'openai' = geminiKey ? 'gemini' : 'openai';
  const model = provider === 'gemini' ? process.env.GEMINI_MODEL : process.env.OPENAI_MODEL;

  const translationOptions: TranslationOptions = {
    apiKey,
    provider,
    model,
  };

  console.log(`🚀 Synchronizing store metadata from reference [${REFERENCE_LOCALE}] using ${provider}...`);
  if (upToDateLocales.length > 0) {
    console.log(`⏭️  Up to date (skipped): ${upToDateLocales.join(', ')}`);
  }
  console.log(`🌐 Locales to translate: ${localesToTranslate.join(', ')}\n`);

  checksums.referenceHash = currentHash;

  for (const locale of localesToTranslate) {
    console.log(`🌐 Translating metadata for [${locale}]...`);
    try {
      const translated = await translateMetadata(locale, reference, translationOptions);
      saveMetadata(locale, translated);

      const check = validateLocaleMetadata(locale);
      if (check.valid) {
        console.log(`   ✅ Successfully saved and verified [${locale}] (${check.summaryLength}/132 chars)`);
        checksums.locales[locale] = currentHash;
        saveChecksums(checksums);
      } else {
        console.warn(`   ⚠️ Saved [${locale}], but verification had issues:`);
        for (const issue of check.issues) {
          console.warn(`      - ${issue.message}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ Failed to translate [${locale}]:`, err instanceof Error ? err.message : err);
    }
  }

  console.log('\n✨ Synchronization complete! Running final check...\n');
  const { execSync } = await import('node:child_process');
  execSync('npx tsx scripts/check-store-metadata.ts', { stdio: 'inherit' });
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
