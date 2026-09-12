import fs from 'node:fs';
import path from 'node:path';
import { MAX_SUMMARY_LENGTH, REFERENCE_LOCALE, SRC_LOCALES_DIR, STORE_METADATA_DIR } from './config';
import type { LocaleValidationResult, ValidationIssue, ValidationReport } from './types';

export function getAvailableLocales(): string[] {
  if (!fs.existsSync(SRC_LOCALES_DIR)) {
    return [REFERENCE_LOCALE];
  }
  return fs
    .readdirSync(SRC_LOCALES_DIR)
    .filter((file) => file.endsWith('.yml'))
    .map((file) => file.replace(/\.yml$/, ''))
    .sort();
}

export function countBulletPoints(markdown: string): number {
  return markdown.split('\n').filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith('•') || trimmed.startsWith('- ') || trimmed.startsWith('* ');
  }).length;
}

export function validateLocaleMetadata(locale: string, expectedBullets?: number): LocaleValidationResult {
  const issues: ValidationIssue[] = [];
  const localeDir = path.join(STORE_METADATA_DIR, locale);
  const summaryPath = path.join(localeDir, 'summary.txt');
  const descriptionPath = path.join(localeDir, 'description.md');

  if (!fs.existsSync(localeDir)) {
    issues.push({
      locale,
      file: 'directory',
      message: `Metadata directory missing: store/metadata/${locale}/`,
      level: 'error',
    });
    return {
      locale,
      valid: false,
      summaryLength: 0,
      bulletCount: 0,
      issues,
    };
  }

  let summaryLength = 0;
  if (!fs.existsSync(summaryPath)) {
    issues.push({
      locale,
      file: 'summary.txt',
      message: 'summary.txt is missing',
      level: 'error',
    });
  } else {
    const summary = fs.readFileSync(summaryPath, 'utf-8').trim();
    summaryLength = summary.length;
    if (summaryLength === 0) {
      issues.push({
        locale,
        file: 'summary.txt',
        message: 'summary.txt is empty',
        level: 'error',
      });
    } else if (summaryLength > MAX_SUMMARY_LENGTH) {
      issues.push({
        locale,
        file: 'summary.txt',
        message: `summary.txt exceeds limit (${summaryLength}/${MAX_SUMMARY_LENGTH} characters): "${summary}"`,
        level: 'error',
      });
    }
  }

  let bulletCount = 0;
  if (!fs.existsSync(descriptionPath)) {
    issues.push({
      locale,
      file: 'description.md',
      message: 'description.md is missing',
      level: 'error',
    });
  } else {
    const description = fs.readFileSync(descriptionPath, 'utf-8').trim();
    if (description.length === 0) {
      issues.push({
        locale,
        file: 'description.md',
        message: 'description.md is empty',
        level: 'error',
      });
    } else {
      bulletCount = countBulletPoints(description);
      if (expectedBullets !== undefined && bulletCount !== expectedBullets) {
        issues.push({
          locale,
          file: 'description.md',
          message: `Bullet count mismatch: found ${bulletCount}, expected ${expectedBullets} (reference)`,
          level: 'warning',
        });
      }
    }
  }

  const hasErrors = issues.some((issue) => issue.level === 'error');

  return {
    locale,
    valid: !hasErrors,
    summaryLength,
    bulletCount,
    issues,
  };
}

export function validateAllMetadata(): ValidationReport {
  const locales = getAvailableLocales();
  const refDir = path.join(STORE_METADATA_DIR, REFERENCE_LOCALE);
  const refDescPath = path.join(refDir, 'description.md');

  let referenceBullets = 0;
  if (fs.existsSync(refDescPath)) {
    referenceBullets = countBulletPoints(fs.readFileSync(refDescPath, 'utf-8'));
  }

  const results = locales.map((locale) => validateLocaleMetadata(locale, referenceBullets));
  const valid = results.every((r) => r.valid);

  return {
    valid,
    referenceBullets,
    results,
  };
}
