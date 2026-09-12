import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { STORE_METADATA_DIR } from './config';
import type { ChecksumData, MetadataContent } from './types';

export const CHECKSUMS_FILE_PATH = path.join(STORE_METADATA_DIR, '.checksums.json');

export function computeReferenceHash(reference: MetadataContent): string {
  return crypto.createHash('sha256').update(`${reference.summary}\n---\n${reference.description}`).digest('hex');
}

export function loadChecksums(): ChecksumData {
  if (!fs.existsSync(CHECKSUMS_FILE_PATH)) {
    return {
      referenceHash: '',
      locales: {},
    };
  }

  try {
    const content = fs.readFileSync(CHECKSUMS_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(content) as ChecksumData;
    return {
      referenceHash: parsed.referenceHash || '',
      locales: parsed.locales || {},
    };
  } catch {
    return {
      referenceHash: '',
      locales: {},
    };
  }
}

export function saveChecksums(data: ChecksumData): void {
  fs.mkdirSync(STORE_METADATA_DIR, { recursive: true });
  fs.writeFileSync(CHECKSUMS_FILE_PATH, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
