import { MAX_SUMMARY_LENGTH } from './metadata/config';
import { validateAllMetadata } from './metadata/validator';

function main(): void {
  console.log('🔍 Checking store metadata files for all supported locales...\n');

  const report = validateAllMetadata();

  console.log(`Reference bullet points: ${report.referenceBullets}\n`);
  console.log('Locale | Summary Length | Bullets | Status');
  console.log('-------|----------------|---------|-------');

  let hasWarnings = false;

  for (const res of report.results) {
    const status = res.valid ? '✅ OK' : '❌ FAIL';
    const summaryCol = `${res.summaryLength.toString().padStart(3, ' ')}/${MAX_SUMMARY_LENGTH} chars`;
    const bulletCol = `${res.bulletCount.toString().padStart(2, ' ')}/${report.referenceBullets}`;
    console.log(
      `${res.locale.padEnd(6, ' ')} | ${summaryCol.padEnd(14, ' ')} | ${bulletCol.padEnd(7, ' ')} | ${status}`,
    );

    for (const issue of res.issues) {
      if (issue.level === 'warning') {
        hasWarnings = true;
        console.log(`   ⚠️ [${issue.file}] ${issue.message}`);
      } else {
        console.log(`   ❌ [${issue.file}] ${issue.message}`);
      }
    }
  }

  console.log('');

  if (!report.valid) {
    console.error('❌ Store metadata check failed! Please fix the errors listed above.');
    process.exit(1);
  }

  if (hasWarnings) {
    console.log('⚠️ Store metadata check passed with warnings.');
  } else {
    console.log('🎉 All store metadata files are valid and conform to store constraints!');
  }
}

main();
