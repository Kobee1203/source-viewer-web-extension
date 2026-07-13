<script setup lang="ts">
import { THEMES } from '../utils/themes';
import { t } from '../utils/i18n';

defineProps<{ themeId: string; wordWrap: boolean }>();
const emit = defineEmits<{
  'update:themeId': [value: string];
  'update:wordWrap': [value: boolean];
}>();

function onThemeChange(event: Event): void {
  emit('update:themeId', (event.target as HTMLSelectElement).value);
}

function onWrapChange(event: Event): void {
  emit('update:wordWrap', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar-group left">
      <input
        id="word-wrap-checkbox"
        type="checkbox"
        :checked="wordWrap"
        @change="onWrapChange"
      />
      <label for="word-wrap-checkbox" style="margin-right: 0; cursor: pointer">
        {{ t('viewerWordWrap') }}
      </label>
    </div>
    <div class="toolbar-group">
      <label for="theme-selector">{{ t('viewerTheme') }}</label>
      <select id="theme-selector" :value="themeId" @change="onThemeChange">
        <option v-for="theme in THEMES" :key="theme.id" :value="theme.id">
          {{ theme.name }}
        </option>
      </select>
    </div>
  </div>
</template>
