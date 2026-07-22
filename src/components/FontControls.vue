<script setup lang="ts">
import { Bold, Italic, Sun, Moon } from '@lucide/vue';
import { t } from '@/utils/i18n';

// Two-way bound preview settings, owned by the font viewer's App.
const text = defineModel<string>('text', { required: true });
const size = defineModel<number>('size', { required: true });
const bold = defineModel<boolean>('bold', { required: true });
const italic = defineModel<boolean>('italic', { required: true });
const darkBg = defineModel<boolean>('darkBg', { required: true });
</script>

<template>
  <div class="toolbar">
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

    <button
      type="button"
      class="icon-btn"
      :class="{ active: bold }"
      :aria-pressed="bold"
      :title="t('fontViewerBold')"
      :aria-label="t('fontViewerBold')"
      @click="bold = !bold"
    >
      <Bold :size="20" />
    </button>

    <button
      type="button"
      class="icon-btn"
      :class="{ active: italic }"
      :aria-pressed="italic"
      :title="t('fontViewerItalic')"
      :aria-label="t('fontViewerItalic')"
      @click="italic = !italic"
    >
      <Italic :size="20" />
    </button>

    <button
      type="button"
      class="icon-btn"
      :class="{ active: darkBg }"
      :aria-pressed="darkBg"
      :title="t('fontViewerBackground')"
      :aria-label="t('fontViewerBackground')"
      @click="darkBg = !darkBg"
    >
      <component :is="darkBg ? Sun : Moon" :size="20" />
    </button>
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

.spacer {
  margin-left: auto;
}

.sep {
  align-self: stretch;
  width: 1px;
  margin: 2px 4px;
  background: var(--toolbar-border);
  filter: brightness(1.5);
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
