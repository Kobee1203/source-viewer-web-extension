import { ref, watch, type Ref } from 'vue';
import { createCoverageTester, coversAny } from '@/utils/glyphCoverage';
import { WRITING_SYSTEMS, type WritingSystem } from '@/utils/writingSystems';

/**
 * Reactive list of the writing systems the loaded font actually covers, out of
 * {@link WRITING_SYSTEMS}. Recomputes whenever `family` changes, mirroring `useGlyphCoverage`.
 */
export function useWritingSystems(family: () => string): { available: Ref<WritingSystem[]> } {
  const available = ref<WritingSystem[]>([]);

  watch(
    family,
    (value) => {
      if (!value) {
        available.value = [];
        return;
      }
      // The tester attaches an offscreen canvas to the DOM; dispose it once probing is done.
      const tester = createCoverageTester(value);
      available.value = WRITING_SYSTEMS.filter((ws) => coversAny(tester, ws.probe));
      tester.dispose();
    },
    { immediate: true },
  );

  return { available };
}
