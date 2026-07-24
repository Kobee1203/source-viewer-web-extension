import { ref, watch, type Ref } from 'vue';
import { createCoverageTester } from '@/utils/glyphCoverage';
import { GLYPH_SAMPLE } from '@/utils/glyphSample';

/**
 * Reactive list of the sampled code points a font actually covers.
 *
 * Recomputes whenever `family` changes. The probing is synchronous: a few hundred code points
 * rendered on a tiny offscreen canvas is imperceptible next to the font download itself.
 */
export function useGlyphCoverage(family: () => string): { covered: Ref<number[]> } {
  const covered = ref<number[]>([]);

  watch(
    family,
    (value) => {
      if (!value) {
        covered.value = [];
        return;
      }
      // The tester attaches an offscreen canvas to the DOM; dispose it once probing is done.
      const tester = createCoverageTester(value);
      covered.value = GLYPH_SAMPLE.filter((cp) => tester.covers(cp));
      tester.dispose();
    },
    { immediate: true },
  );

  return { covered };
}
