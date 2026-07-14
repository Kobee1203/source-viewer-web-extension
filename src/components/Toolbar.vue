<script setup lang="ts">
import { WrapText, Palette, FileCode } from '@lucide/vue';
import { THEMES } from '@/utils/themes';
import { openNativeViewer } from '@/utils/nativeViewer';
import { t } from '@/utils/i18n';

const props = defineProps<{
  themeId: string;
  wordWrap: boolean;
  targetUrl: URL | null;
}>();
const emit = defineEmits<{
  'update:themeId': [value: string];
  'update:wordWrap': [value: boolean];
}>();

function onThemeChange(event: Event): void {
  emit('update:themeId', (event.target as HTMLSelectElement).value);
}

function toggleWrap(): void {
  emit('update:wordWrap', !props.wordWrap);
}

/** Opens the target URL in the browser's native `view-source:` viewer. */
function openNative(newTab: boolean): void {
  if (!props.targetUrl) return;
  void openNativeViewer(props.targetUrl, newTab);
}

// No real `href`: `view-source:` cannot be navigated to via <a href>, so gestures
// are intercepted and routed through the `tabs` API instead.
function onNativeClick(event: MouseEvent): void {
  event.preventDefault();
  openNative(event.ctrlKey || event.metaKey);
}

function onNativeAuxClick(event: MouseEvent): void {
  if (event.button !== 1) return; // middle click only
  event.preventDefault();
  openNative(true);
}
</script>

<template>
  <div class="toolbar">
    <button
      type="button"
      class="icon-btn"
      :class="{ active: wordWrap }"
      :aria-pressed="wordWrap"
      :title="t('viewerWordWrap')"
      :aria-label="t('viewerWordWrap')"
      @click="toggleWrap"
    >
      <WrapText :size="20" />
    </button>

    <span class="spacer"></span>

    <div class="theme-select">
      <Palette class="lead-ic" :size="20" aria-hidden="true" />
      <select
        id="theme-selector"
        :value="themeId"
        :title="t('viewerTheme')"
        :aria-label="t('viewerTheme')"
        @change="onThemeChange"
      >
        <option v-for="theme in THEMES" :key="theme.id" :value="theme.id">
          {{ theme.name }}
        </option>
      </select>
    </div>

    <template v-if="targetUrl">
      <span class="sep"></span>
      <button
        type="button"
        class="icon-btn"
        :title="t('viewerOpenNative')"
        :aria-label="t('viewerOpenNative')"
        @click="onNativeClick"
        @auxclick="onNativeAuxClick"
      >
        <FileCode :size="20" />
      </button>
    </template>
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

/* Icon button — shared by the word-wrap toggle and the native-viewer action. */
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

/* Single control: appearance icon overlaid on the left of a native <select>. */
.theme-select {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.theme-select .lead-ic {
  position: absolute;
  left: 9px;
  color: var(--select-fg);
  pointer-events: none;
}

.theme-select select {
  height: 32px;
  padding: 0 10px 0 32px;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  cursor: pointer;
  outline: none;
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}
</style>
