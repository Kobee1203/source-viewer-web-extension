<script setup lang="ts">
import { computed } from 'vue';
import { type OpenInMode, usePreferences } from '@/composables/usePreferences';
import { DEFAULT_FONT_SIZE } from '@/utils/fonts';
import { t } from '@/utils/i18n';
import { THEMES } from '@/utils/themes';

const { themeId, wordWrap, codeFontSize, openIn } = usePreferences();

const selectedTheme = computed(() => THEMES.find((theme) => theme.id === themeId.value));
const currentThemeType = computed(() => selectedTheme.value?.type ?? 'dark');

const fontSizes = computed(() => {
  const sizes: { value: number; label: string }[] = [];
  const predefined = [8, 9, 10, 11, 12, DEFAULT_FONT_SIZE, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
  predefined.forEach((size) => sizes.push({ value: size, label: size + 'px' }));
  return sizes;
});

function onOpenInChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    openIn.value = event.target.value as OpenInMode;
  }
}

function onThemeChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    themeId.value = event.target.value;
  }
}

function onFontSizeChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    codeFontSize.value = parseInt(event.target.value, 10);
  }
}

function onWordWrapChange(event: Event): void {
  if (event.target instanceof HTMLInputElement) {
    wordWrap.value = event.target.checked;
  }
}
</script>

<template>
  <main class="options-container" :data-theme-type="currentThemeType">
    <header class="options-header">
      <h1>{{ t('settingsTitle') }}</h1>
    </header>

    <div class="options-card">
      <div class="setting-row">
        <div class="setting-info">
          <label for="setting-open-in" class="setting-label">{{ t('settingsOpenInLabel') }}</label>
          <span class="setting-desc">{{ t('settingsOpenInDescription') }}</span>
        </div>
        <select id="setting-open-in" :value="openIn" class="setting-select" @change="onOpenInChange">
          <option value="new-tab">{{ t('settingsOpenInNewTab') }}</option>
          <option value="current-tab">{{ t('settingsOpenInCurrentTab') }}</option>
        </select>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <label for="setting-theme" class="setting-label">{{ t('viewerTheme') }}</label>
        </div>
        <select id="setting-theme" :value="themeId" class="setting-select" @change="onThemeChange">
          <option v-for="theme in THEMES" :key="theme.id" :value="theme.id">
            {{ theme.name }}
          </option>
        </select>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <label for="setting-font-size" class="setting-label">{{ t('viewerFontSize') }}</label>
        </div>
        <select id="setting-font-size" :value="codeFontSize" class="setting-select" @change="onFontSizeChange">
          <option v-for="size in fontSizes" :key="size.value" :value="size.value">
            {{ size.label }}
          </option>
        </select>
      </div>

      <div class="setting-row">
        <div class="setting-info">
          <label for="setting-word-wrap" class="setting-label">{{ t('viewerWordWrap') }}</label>
        </div>
        <input
          id="setting-word-wrap"
          type="checkbox"
          :checked="wordWrap"
          class="setting-checkbox"
          @change="onWordWrapChange"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
.options-container {
  max-width: 640px;
  padding: 32px 24px;
  margin: 0 auto;
}

.options-header h1 {
  margin: 0 0 24px;
  font-size: 24px;
  font-weight: 600;
}

.options-card {
  display: flex;
  flex-direction: column;
  background: var(--select-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.setting-row:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--app-fg);
}

.setting-desc {
  font-size: 12px;
  color: var(--app-fg);
  opacity: 0.75;
}

.setting-select {
  min-width: 180px;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  cursor: pointer;
  outline: none;
  background: var(--app-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.setting-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
