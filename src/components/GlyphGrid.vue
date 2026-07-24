<script setup lang="ts">
import { useGlyphCoverage } from '@/composables/useGlyphCoverage';
import { useCopyFeedback } from '@/composables/useCopyFeedback';
import { codePointLabel } from '@/utils/glyphSample';
import { t } from '@/utils/i18n';

const props = defineProps<{ family: string }>();

const { covered } = useGlyphCoverage(() => props.family);
const { copied, copy } = useCopyFeedback<number>();
</script>

<template>
  <div class="glyph-grid">
    <button
      v-for="cp in covered"
      :key="cp"
      type="button"
      class="glyph-cell"
      :class="{ copied: copied === cp }"
      :title="codePointLabel(cp)"
      :style="{ fontFamily: `'${props.family}', sans-serif` }"
      @click="copy(String.fromCodePoint(cp), cp)"
    >
      {{ String.fromCodePoint(cp) }}
    </button>
    <span class="sr-only" role="status" aria-live="polite">{{ copied !== null ? t('viewerCopied') : '' }}</span>
  </div>
</template>

<style scoped>
.glyph-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(56px, 1fr));
  gap: 6px;
  padding: 16px;
}

.glyph-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  padding: 0;
  font-size: 28px;
  line-height: 1;
  color: var(--app-fg);
  cursor: pointer;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 5px;
}

.glyph-cell:hover {
  background: var(--btn-bg-hover);
}

.glyph-cell.copied {
  color: var(--btn-active-fg);
  background: var(--btn-active-bg);
  border-color: var(--btn-active-border);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  white-space: nowrap;
  clip-path: inset(50%);
}
</style>
