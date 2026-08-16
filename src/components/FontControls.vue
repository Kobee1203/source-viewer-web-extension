<script setup lang="ts">
import { Type, LayoutGrid } from '@lucide/vue';
import IconButton from '@/components/IconButton.vue';
import FontPreviewControls from '@/components/FontPreviewControls.vue';
import { t } from '@/utils/i18n';

// Which view is shown; the preview settings only apply to (and only show in) the preview view.
const view = defineModel<'preview' | 'glyphs'>('view', { required: true });

// Loaded font's family name, forwarded to FontPreviewControls for its writing-system dropdown.
defineProps<{ family: string }>();

// Preview settings, owned by the font viewer's App and forwarded to FontPreviewControls.
const text = defineModel<string>('text', { required: true });
const size = defineModel<number>('size', { required: true });
const bold = defineModel<boolean>('bold', { required: true });
const italic = defineModel<boolean>('italic', { required: true });
const darkBg = defineModel<boolean>('darkBg', { required: true });
</script>

<template>
  <div class="toolbar">
    <div class="view-switch" role="group">
      <IconButton :active="view === 'preview'" :label="t('fontViewerViewPreview')" @click="view = 'preview'">
        <Type :size="20" />
      </IconButton>
      <IconButton :active="view === 'glyphs'" :label="t('fontViewerViewGlyphs')" @click="view = 'glyphs'">
        <LayoutGrid :size="20" />
      </IconButton>
    </div>

    <FontPreviewControls
      v-if="view === 'preview'"
      v-model:text="text"
      v-model:size="size"
      v-model:bold="bold"
      v-model:italic="italic"
      v-model:dark-bg="darkBg"
      :family="family"
    />
  </div>
</template>

<style scoped>
.view-switch {
  display: inline-flex;
  gap: 4px;
}
</style>
