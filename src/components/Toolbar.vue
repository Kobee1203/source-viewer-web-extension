<script setup lang="ts">
import { computed } from 'vue';
import { Download, FileCode, Palette, PanelLeft, Search, Type, WrapText } from '@lucide/vue';
import IconButton from '@/components/IconButton.vue';
import { downloadSource } from '@/utils/download';
import type { FileType } from '@/utils/fileType';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { t } from '@/utils/i18n';
import { openNativeViewer } from '@/utils/nativeViewer';
import { THEMES } from '@/utils/themes';

const props = defineProps<{
  themeId: string;
  wordWrap: boolean;
  fontSize: number;
  targetUrl: URL | null;
  code: string;
  language: FileType;
  contentDisposition: string | null;
  sidebarOpen: boolean;
}>();
const emit = defineEmits<{
  'update:themeId': [value: string];
  'update:wordWrap': [value: boolean];
  'update:fontSize': [value: number];
  search: [];
  'toggle-sidebar': [];
}>();

const fontSizes = computed(() => {
  const sizes: { value: number; label: string }[] = [];
  const predefined = [8, 9, 10, 11, 12, DEFAULT_FONT_SIZE, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  predefined.forEach((size) => sizes.push({ value: size, label: size + 'px' }));
  return sizes;
});

function onFontSizeChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  emit('update:fontSize', parseInt(value, 10));
}

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

/** Downloads the formatted source shown in the viewer. */
function onDownload(): void {
  if (!props.targetUrl || !props.code) return;
  downloadSource(props.code, props.language, props.targetUrl, props.contentDisposition);
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
    <IconButton v-if="code" :active="sidebarOpen" :label="t('viewerToggleSidebar')" @click="emit('toggle-sidebar')">
      <PanelLeft :size="20" />
    </IconButton>

    <IconButton :active="wordWrap" :label="t('viewerWordWrap')" @click="toggleWrap">
      <WrapText :size="20" />
    </IconButton>

    <span class="spacer"></span>

    <div class="custom-select">
      <Type class="lead-ic" :size="20" aria-hidden="true" />
      <select
        id="font-size-selector"
        :value="fontSize"
        :title="t('viewerFontSize')"
        :aria-label="t('viewerFontSize')"
        @change="onFontSizeChange"
      >
        <option v-for="size in fontSizes" :key="size.value" :value="size.value">
          {{ size.label }}
        </option>
      </select>
    </div>

    <span class="sep"></span>

    <div class="custom-select">
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
      <IconButton v-if="code" :label="t('viewerSearch')" @click="emit('search')">
        <Search :size="20" />
      </IconButton>
      <IconButton v-if="code" :label="t('viewerDownload')" @click="onDownload">
        <Download :size="20" />
      </IconButton>
      <IconButton :label="t('viewerOpenNative')" @click="onNativeClick" @auxclick="onNativeAuxClick">
        <FileCode :size="20" />
      </IconButton>
    </template>
  </div>
</template>

<style scoped>
/* Single control: appearance icon overlaid on the left of a native <select>. */
.custom-select {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.custom-select .lead-ic {
  position: absolute;
  left: 9px;
  color: var(--select-fg);
  pointer-events: none;
}

.custom-select select {
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
