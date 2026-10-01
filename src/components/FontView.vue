<script setup lang="ts">
import { ref } from 'vue';
import FontControls from '@/components/FontControls.vue';
import FontPreview from '@/components/FontPreview.vue';
import GlyphGrid from '@/components/GlyphGrid.vue';
import { useFontPreferences } from '@/composables/useFontPreferences';

defineProps<{
  family: string;
}>();

const { previewText, fontSize, bold, italic, darkBg } = useFontPreferences();
const view = ref<'preview' | 'glyphs'>('preview');
</script>

<template>
  <div class="font-view">
    <FontControls
      v-model:view="view"
      v-model:text="previewText"
      v-model:size="fontSize"
      v-model:bold="bold"
      v-model:italic="italic"
      v-model:dark-bg="darkBg"
      :family="family"
    />

    <div class="font-content">
      <GlyphGrid v-if="view === 'glyphs'" :family="family" />
      <FontPreview
        v-else
        :family="family"
        :text="previewText"
        :size="fontSize"
        :bold="bold"
        :italic="italic"
        :dark-bg="darkBg"
      />
    </div>
  </div>
</template>

<style scoped>
.font-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.font-content {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
</style>
