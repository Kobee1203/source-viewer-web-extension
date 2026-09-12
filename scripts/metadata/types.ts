export interface MetadataContent {
  summary: string;
  description: string;
}

export interface ValidationIssue {
  locale: string;
  file: 'summary.txt' | 'description.md' | 'directory';
  message: string;
  level: 'error' | 'warning';
}

export interface LocaleValidationResult {
  locale: string;
  valid: boolean;
  summaryLength: number;
  bulletCount: number;
  issues: ValidationIssue[];
}

export interface ValidationReport {
  valid: boolean;
  referenceBullets: number;
  results: LocaleValidationResult[];
}

export interface ChecksumData {
  referenceHash: string;
  locales: Record<string, string>;
}

export interface TranslationOptions {
  apiKey: string;
  provider?: 'gemini' | 'openai';
  model?: string;
}
