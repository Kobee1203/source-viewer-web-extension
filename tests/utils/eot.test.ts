import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { convertEotToTtf, isEot } from '@/utils/eot';

function createSyntheticEot(ttfData: Uint8Array, version = 0x00010000): Uint8Array {
  const headerLen = 96;
  const eotSize = headerLen + ttfData.byteLength;
  const buffer = new Uint8Array(eotSize);
  const view = new DataView(buffer.buffer);
  view.setUint32(0, eotSize, true);
  view.setUint32(4, ttfData.byteLength, true);
  view.setUint32(8, version, true);
  view.setUint32(12, 0, true);
  view.setUint16(34, 0x504c, true);
  buffer.set(ttfData, headerLen);
  return buffer;
}

describe('eot utilities', () => {
  const dummyTtf = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);

  describe('isEot', () => {
    it('returns false for buffers shorter than the minimum header length', () => {
      expect(isEot(new Uint8Array(50))).toBe(false);
      expect(isEot(new ArrayBuffer(81))).toBe(false);
    });

    it('returns false when magic number does not match 0x504C', () => {
      const buffer = new Uint8Array(100);
      expect(isEot(buffer)).toBe(false);
    });

    it('returns false when version is unrecognized', () => {
      const eot = createSyntheticEot(dummyTtf, 0x00030000);
      expect(isEot(eot)).toBe(false);
    });

    it('returns true for synthetic EOT version 1', () => {
      const eot = createSyntheticEot(dummyTtf, 0x00010000);
      expect(isEot(eot)).toBe(true);
      expect(isEot(eot.buffer)).toBe(true);
    });

    it('returns true for synthetic EOT version 2.1 and 2.2', () => {
      expect(isEot(createSyntheticEot(dummyTtf, 0x00020001))).toBe(true);
      expect(isEot(createSyntheticEot(dummyTtf, 0x00020002))).toBe(true);
    });

    it('handles Uint8Array views with non-zero byte offsets', () => {
      const eot = createSyntheticEot(dummyTtf);
      const padded = new Uint8Array(eot.length + 10);
      padded.set(eot, 10);
      const sliceView = padded.subarray(10);
      expect(isEot(sliceView)).toBe(true);
    });

    it('detects real-world EOT font fixture', () => {
      const fixturePath = resolve(__dirname, '../fixtures/fa-regular-400.eot');
      const fixtureBytes = readFileSync(fixturePath);
      expect(isEot(fixtureBytes)).toBe(true);
    });
  });

  describe('convertEotToTtf', () => {
    it('unpacks synthetic uncompressed EOT to original TrueType bytes', () => {
      const eot = createSyntheticEot(dummyTtf);
      const ttfBuffer = convertEotToTtf(eot);
      const ttfBytes = new Uint8Array(ttfBuffer);
      expect(Array.from(ttfBytes)).toEqual(Array.from(dummyTtf));
    });

    it('successfully extracts a valid TrueType font from real-world EOT fixture', () => {
      const fixturePath = resolve(__dirname, '../fixtures/fa-regular-400.eot');
      const fixtureBytes = readFileSync(fixturePath);
      const ttfBuffer = convertEotToTtf(fixtureBytes);

      expect(ttfBuffer.byteLength).toBe(34092);
      const view = new DataView(ttfBuffer);
      // Valid TrueType sfnt version tag: 0x00010000
      expect(view.getUint32(0, false)).toBe(0x00010000);
    });

    it('throws when given invalid or corrupted data', () => {
      const corrupt = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
      expect(() => convertEotToTtf(corrupt)).toThrow();
    });
  });
});
