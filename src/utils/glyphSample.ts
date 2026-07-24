/**
 * A curated set of Unicode code points probed for the glyph grid. Since we don't parse the
 * font's cmap (see glyphCoverage.ts), we can't enumerate a font's real glyph inventory — we
 * instead render this fixed sample and keep only the code points the font actually covers.
 *
 * Consequence: fonts with very large coverage (e.g. CJK) only ever show this Latin-centric
 * sample, not their full glyph set. Enumerating those would require reading the cmap.
 */

/** Inclusive `[start, end]` code point ranges. */
const RANGES: [number, number][] = [
  [0x21, 0x7e], // Basic Latin (printable)
  [0xa1, 0xff], // Latin-1 Supplement (printable)
  [0x100, 0x17f], // Latin Extended-A
  [0x180, 0x24f], // Latin Extended-B
  [0x20a0, 0x20bf], // Currency Symbols
];

/** Individually picked code points (common punctuation, symbols, math, arrows). */
const SINGLES: number[] = [
  // General Punctuation
  0x2013, 0x2014, 0x2018, 0x2019, 0x201a, 0x201c, 0x201d, 0x201e, 0x2020, 0x2021, 0x2022, 0x2026, 0x2030, 0x2032,
  0x2033, 0x2039, 0x203a,
  // Letterlike symbols
  0x2113, 0x2116, 0x2122, 0x2126,
  // Arrows
  0x2190, 0x2191, 0x2192, 0x2193, 0x2194, 0x2195,
  // Mathematical operators
  0x2202, 0x2206, 0x220f, 0x2211, 0x2212, 0x221a, 0x221e, 0x222b, 0x2248, 0x2260, 0x2264, 0x2265,
  // Geometric shapes & misc symbols
  0x25a0, 0x25aa, 0x25cf, 0x2605, 0x2606, 0x2660, 0x2663, 0x2665, 0x2666, 0x2713, 0x2717,
];

function expand(): number[] {
  const out: number[] = [];
  for (const [start, end] of RANGES) {
    for (let cp = start; cp <= end; cp++) out.push(cp);
  }
  return out.concat(SINGLES);
}

/** All sampled code points, in display order. */
export const GLYPH_SAMPLE: number[] = expand();

/** `U+XXXX` label for a code point. */
export function codePointLabel(cp: number): string {
  return 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');
}
