<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { OpenInMode } from '@/composables/usePreferences';
import { t } from '@/utils/i18n';
import Dialog from './Dialog.vue';

defineProps<{
  openIn: OpenInMode;
}>();

const emit = defineEmits<{
  'update:openIn': [value: OpenInMode];
  closed: [];
}>();

const dialogRef = ref<{ open: () => void; close: () => void } | null>(null);

onMounted(() => {
  dialogRef.value?.open();
});

function onClosed(): void {
  emit('closed');
}

function onOpenInChange(event: Event): void {
  if (event.target instanceof HTMLSelectElement) {
    emit('update:openIn', event.target.value as OpenInMode);
  }
}
</script>

<template>
  <Dialog ref="dialogRef" :title="t('settingsTitle')" @close="onClosed">
    <div class="settings-form">
      <div class="settings-field">
        <label for="settings-open-in" class="settings-label">{{ t('settingsOpenInLabel') }}</label>
        <select id="settings-open-in" :value="openIn" class="settings-select" @change="onOpenInChange">
          <option value="new-tab">{{ t('settingsOpenInNewTab') }}</option>
          <option value="current-tab">{{ t('settingsOpenInCurrentTab') }}</option>
        </select>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 320px;
  margin-top: 8px;
}

.settings-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.settings-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--app-fg);
}

.settings-select {
  height: 32px;
  padding: 0 10px;
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
