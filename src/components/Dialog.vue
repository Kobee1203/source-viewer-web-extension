<script setup lang="ts">
import { ref } from 'vue';
import { t } from '@/utils/i18n';

defineProps<{ title: string }>();

const emit = defineEmits(['close']);

const dialog = ref<HTMLDialogElement | null>(null);

function open() {
  dialog.value?.showModal();
}

function close() {
  dialog.value?.close();
}

function onClick(event: MouseEvent) {
  if (event.target === dialog.value) {
    close();
  }
}

defineExpose({ open, close });
</script>

<template>
  <dialog ref="dialog" class="dialog-base" :title="title" :aria-label="title" @click="onClick" @close="emit('close')">
    <div class="dialog-header">
      <h2>{{ title }}</h2>
      <button
        class="dialog-close"
        :aria-label="t('dialogClose')"
        :title="t('dialogClose')"
        type="button"
        @click="close"
      >
        ×
      </button>
    </div>
    <div class="dialog-content">
      <slot />
    </div>
  </dialog>
</template>

<style scoped>
.dialog-base {
  max-width: 600px;
  padding: 16px;
  color: var(--app-fg);
  background: var(--dialog-bg);
  border: 1px solid var(--dialog-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 15%);
}

.dialog-base::backdrop {
  background: var(--dialog-backdrop);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.dialog-close {
  font-size: 1.5rem;
  color: var(--app-fg);
  cursor: pointer;
  background: transparent;
  border: none;
}
</style>
