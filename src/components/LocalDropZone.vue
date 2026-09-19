<script setup lang="ts">
import { ref } from 'vue';
import { FileUp, FolderOpen } from '@lucide/vue';
import { pickLocalFile } from '@/composables/useLocalFile';
import { t } from '@/utils/i18n';

const emit = defineEmits<{
  'file-selected': [file: File, handle?: FileSystemFileHandle];
}>();

const isDragging = ref(false);

function onDragOver(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = true;
}

function onDragLeave(): void {
  isDragging.value = false;
}

function onDrop(event: DragEvent): void {
  event.preventDefault();
  isDragging.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) {
    emit('file-selected', file);
  }
}

async function onBrowse(): Promise<void> {
  const result = await pickLocalFile();
  if (result) {
    emit('file-selected', result.file, result.handle);
  }
}
</script>

<template>
  <div
    class="drop-zone"
    :class="{ 'is-dragging': isDragging }"
    tabindex="0"
    role="button"
    :aria-label="t('viewerDropFileHere')"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
    @click="onBrowse"
    @keydown.enter.prevent="onBrowse"
    @keydown.space.prevent="onBrowse"
  >
    <div class="drop-content">
      <FileUp v-if="isDragging" class="drop-icon pulse" :size="48" />
      <FolderOpen v-else class="drop-icon" :size="48" />
      <h2 class="drop-title">{{ t('viewerDropFileHere') }}</h2>
      <p class="drop-hint">{{ t('viewerDropHint') }}</p>
      <button type="button" class="browse-btn" @click.stop="onBrowse">
        {{ t('viewerOpenLocalFile') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.drop-zone {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 280px;
  padding: 32px;
  cursor: pointer;
  outline: none;
  background: var(--app-bg);
  border: 2px dashed var(--toolbar-border);
  border-radius: 8px;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.drop-zone:hover,
.drop-zone:focus-visible {
  border-color: #007bff;
}

.drop-zone.is-dragging {
  background-color: rgb(0 123 255 / 8%);
  border-color: #007bff;
}

.drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.drop-icon {
  margin-bottom: 16px;
  color: var(--toolbar-fg);
  opacity: 0.7;
  transition:
    transform 0.2s,
    color 0.2s;
}

.drop-zone:hover .drop-icon,
.drop-zone.is-dragging .drop-icon {
  color: #007bff;
  opacity: 1;
  transform: scale(1.08);
}

.pulse {
  animation: drop-pulse 1s infinite alternate;
}

@keyframes drop-pulse {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.12);
  }
}

.drop-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--app-fg);
}

.drop-hint {
  max-width: 420px;
  margin: 0 0 20px;
  font-size: 13px;
  color: var(--toolbar-fg);
  opacity: 0.8;
}

.browse-btn {
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  cursor: pointer;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.browse-btn:hover {
  background-color: #0056b3;
}
</style>
