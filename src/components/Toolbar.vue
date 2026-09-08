<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileText,
  Link,
  Palette,
  PanelLeft,
  Search,
  Settings,
  Type,
  WrapText,
  X,
} from '@lucide/vue';
import DropdownButton, { type DropdownMenuItem } from '@/components/DropdownButton.vue';
import IconButton from '@/components/IconButton.vue';
import SettingsDialog from '@/components/SettingsDialog.vue';
import { useCopyFeedback } from '@/composables/useCopyFeedback';
import type { OpenInMode } from '@/composables/usePreferences';
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
  openIn?: OpenInMode;
  targetUrl: URL | null;
  code: string;
  rawCode: string;
  language: FileType;
  contentDisposition: string | null;
  sidebarOpen: boolean;
}>();
const emit = defineEmits<{
  'update:themeId': [value: string];
  'update:wordWrap': [value: boolean];
  'update:fontSize': [value: number];
  'update:openIn': [value: OpenInMode];
  search: [];
  'toggle-sidebar': [];
}>();

const showSettings = ref(false);
const isInplace = typeof window !== 'undefined' && window.parent !== window;

function onCloseInplace(): void {
  window.parent.postMessage({ type: 'CLOSE_INPLACE_VIEWER' }, '*');
}

const { copied, copy } = useCopyFeedback<boolean>(2000);

async function onCopyFormatted(): Promise<void> {
  if (!props.code) return;
  await copy(props.code, true);
}

async function onCopyRaw(): Promise<void> {
  const text = props.rawCode || props.code;
  if (!text) return;
  await copy(text, true);
}

async function onCopyUrl(): Promise<void> {
  if (!props.targetUrl) return;
  await copy(props.targetUrl.toString(), true);
}

const copyMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: t('viewerCopy'),
    icon: FileCode,
    onSelect: () => void onCopyFormatted(),
  },
  {
    label: t('viewerCopyRaw'),
    icon: FileText,
    onSelect: () => void onCopyRaw(),
  },
  {
    label: t('viewerCopyUrl'),
    icon: Link,
    onSelect: () => void onCopyUrl(),
  },
]);

const fontSizes = computed(() => {
  const sizes: { value: number; label: string }[] = [];
  const predefined = [8, 9, 10, 11, 12, DEFAULT_FONT_SIZE, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  predefined.forEach((size) => sizes.push({ value: size, label: size + 'px' }));
  return sizes;
});

function onFontSizeChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    emit('update:fontSize', parseInt(event.target.value, 10));
  }
}

function onThemeChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    emit('update:themeId', event.target.value);
  }
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
      <DropdownButton v-if="code" :items="copyMenuItems" :label="t('viewerCopyOptions')">
        <button
          type="button"
          class="copy-btn"
          :class="{ copied: !!copied }"
          :title="copied ? t('viewerCopied') : t('viewerCopy')"
          :aria-label="copied ? t('viewerCopied') : t('viewerCopy')"
          @click="onCopyFormatted"
        >
          <Check v-if="copied" :size="20" />
          <Copy v-else :size="20" />
        </button>
      </DropdownButton>
      <IconButton v-if="code" :label="t('viewerDownload')" @click="onDownload">
        <Download :size="20" />
      </IconButton>
      <IconButton :label="t('viewerOpenNative')" @click="onNativeClick" @auxclick="onNativeAuxClick">
        <FileCode :size="20" />
      </IconButton>
    </template>

    <span class="sep"></span>
    <IconButton :label="t('settingsTitle')" @click="showSettings = true">
      <Settings :size="20" />
    </IconButton>
    <IconButton v-if="isInplace" :label="t('viewerClose')" @click="onCloseInplace">
      <X :size="20" />
    </IconButton>

    <SettingsDialog
      v-if="showSettings && openIn"
      :open-in="openIn"
      @update:open-in="(val) => emit('update:openIn', val)"
      @closed="showSettings = false"
    />
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

.copy-btn {
  width: 32px;
}

.copy-btn.copied {
  z-index: 1;
  color: #fff;
  background: #28a745;
  border-color: #218838;
}
</style>
