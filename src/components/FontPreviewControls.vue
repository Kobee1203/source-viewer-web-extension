<script setup lang="ts">
import { Bold, Italic, Sun, Moon } from '@lucide/vue';
import IconButton from '@/components/IconButton.vue';
import { t } from '@/utils/i18n';

// Two-way bound preview settings, owned by the font viewer's App (forwarded via FontControls).
const text = defineModel<string>('text', { required: true });
const size = defineModel<number>('size', { required: true });
const bold = defineModel<boolean>('bold', { required: true });
const italic = defineModel<boolean>('italic', { required: true });
const darkBg = defineModel<boolean>('darkBg', { required: true });
</script>

<template>
  <div class="preview-controls">
    <input
      v-model="text"
      type="text"
      name="preview"
      class="preview-input"
      :placeholder="t('fontViewerPreviewLabel')"
      :aria-label="t('fontViewerPreviewLabel')"
    />

    <span class="spacer"></span>

    <label class="size-control" :title="t('fontViewerSize')">
      <input v-model.number="size" type="range" min="8" max="200" step="1" :aria-label="t('fontViewerSize')" />
      <span class="size-value">{{ size }}px</span>
    </label>

    <span class="sep"></span>

    <IconButton :active="bold" :label="t('fontViewerBold')" @click="bold = !bold">
      <Bold :size="20" />
    </IconButton>

    <IconButton :active="italic" :label="t('fontViewerItalic')" @click="italic = !italic">
      <Italic :size="20" />
    </IconButton>

    <IconButton :active="darkBg" :label="t('fontViewerBackground')" @click="darkBg = !darkBg">
      <component :is="darkBg ? Sun : Moon" :size="20" />
    </IconButton>
  </div>
</template>

<style scoped>
/* Fills the toolbar space beside the view switch; internal spacer splits left/right groups
   (.spacer/.sep are shared globals — see src/styles/toolbar.css). */
.preview-controls {
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  align-items: center;
}

.preview-input {
  flex: 1 1 auto;
  min-width: 120px;
  max-width: 480px;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  outline: none;
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.size-control {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.size-value {
  min-width: 44px;
  font-size: 13px;
  text-align: right;
}
</style>
