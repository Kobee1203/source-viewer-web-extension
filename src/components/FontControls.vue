<script setup lang="ts">
import { Type, LayoutGrid } from '@lucide/vue';
import FontPreviewControls from '@/components/FontPreviewControls.vue';
import { t } from '@/utils/i18n';

// Which view is shown; the preview settings only apply to (and only show in) the preview view.
const view = defineModel<'preview' | 'glyphs'>('view', { required: true });

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
      <button
        type="button"
        class="icon-btn"
        :class="{ active: view === 'preview' }"
        :aria-pressed="view === 'preview'"
        :title="t('fontViewerViewPreview')"
        :aria-label="t('fontViewerViewPreview')"
        @click="view = 'preview'"
      >
        <Type :size="20" />
      </button>
      <button
        type="button"
        class="icon-btn"
        :class="{ active: view === 'glyphs' }"
        :aria-pressed="view === 'glyphs'"
        :title="t('fontViewerViewGlyphs')"
        :aria-label="t('fontViewerViewGlyphs')"
        @click="view = 'glyphs'"
      >
        <LayoutGrid :size="20" />
      </button>
    </div>

    <FontPreviewControls
      v-if="view === 'preview'"
      v-model:text="text"
      v-model:size="size"
      v-model:bold="bold"
      v-model:italic="italic"
      v-model:dark-bg="darkBg"
    />
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 8px 10px;
  color: var(--app-fg);
  background: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
}

.view-switch {
  display: inline-flex;
  gap: 4px;
}

/* Icon button — matches the code viewer's Toolbar. */
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--app-fg);
  cursor: pointer;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 5px;
}

.icon-btn:hover {
  background: var(--btn-bg-hover);
}

.icon-btn.active {
  color: var(--btn-active-fg);
  background: var(--btn-active-bg);
  border-color: var(--btn-active-border);
}
</style>
