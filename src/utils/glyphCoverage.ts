/**
 * Detects which code points a loaded font actually renders, without parsing the font file
 * (no cmap access — we render on a canvas and compare, so woff2 works too).
 *
 * For a code point we render the character twice: once with the font followed by a generic
 * fallback (`"<family>", monospace`) and once with the fallback alone (`monospace`). If the
 * two bitmaps differ, the font supplied its own glyph → covered; if they are identical, the
 * character fell through to the fallback → not covered.
 *
 * A single fallback would misfire when the font's glyph happens to be pixel-identical to the
 * fallback's, so coverage requires the rendering to differ from BOTH `monospace` and `serif`
 * (a false negative would then need the glyph to match two unrelated fallbacks at once).
 *
 * The tester is dependency-free (usable outside Vue) so the language filter can reuse
 * it via {@link coversAny} / {@link coversAll} over per-script probe code points.
 */

export interface CoverageTester {
  /** Whether the font renders its own glyph for `codePoint`. */
  covers(codePoint: number): boolean;
}

const REFERENCE_FONTS = ['monospace', 'serif'] as const;
const CANVAS_SIZE = 32;
const FONT_PX = 24;

function pixelsEqual(a: Uint8ClampedArray, b: Uint8ClampedArray): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function createCoverageTester(fontFamily: string): CoverageTester {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.textBaseline = 'top';

  const cache = new Map<number, boolean>();

  function render(char: string, font: string): Uint8ClampedArray {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.font = `${FONT_PX}px ${font}`;
    ctx.fillText(char, 1, 1);
    return ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  }

  function covers(codePoint: number): boolean {
    const cached = cache.get(codePoint);
    if (cached !== undefined) return cached;

    const char = String.fromCodePoint(codePoint);
    // Covered only if the font's rendering differs from every reference fallback.
    const result = REFERENCE_FONTS.every(
      (ref) => !pixelsEqual(render(char, `"${fontFamily}", ${ref}`), render(char, ref)),
    );

    cache.set(codePoint, result);
    return result;
  }

  return { covers };
}

/** Whether the font covers every one of `codePoints` (empty list → false). */
export function coversAll(tester: CoverageTester, codePoints: number[]): boolean {
  return codePoints.length > 0 && codePoints.every((cp) => tester.covers(cp));
}

/** Whether the font covers at least one of `codePoints`. */
export function coversAny(tester: CoverageTester, codePoints: number[]): boolean {
  return codePoints.some((cp) => tester.covers(cp));
}
