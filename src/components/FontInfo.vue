<script setup lang="ts">
import { computed } from 'vue';
import { formatBytes } from '@/utils/format';
import { t } from '@/utils/i18n';

const props = defineProps<{
  url: string;
  format: string;
  fileSize: number | null;
  loading: boolean;
}>();

const formatLabel = computed(() => (props.format ? props.format.toUpperCase() : '—'));
const sizeLabel = computed(() => (props.fileSize != null ? formatBytes(props.fileSize) : '—'));
const statusLabel = computed(() => (props.loading ? t('fontViewerLoading') : 'OK'));
</script>

<template>
  <div class="font-info">
    <span class="item url" :title="url">{{ t('fontViewerSource') }}: {{ url }}</span>
    <span class="item">{{ t('fontViewerFormat') }}: {{ formatLabel }}</span>
    <span class="item">{{ t('fontViewerFileSize') }}: {{ sizeLabel }}</span>
    <span class="item">{{ t('fontViewerStatus') }}: {{ statusLabel }}</span>
  </div>
</template>

<style scoped>
.font-info {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--app-fg);
  user-select: none;
  background: var(--toolbar-bg);
  border-top: 1px solid var(--toolbar-border);
}

.item {
  flex: 0 0 auto;
  white-space: nowrap;
}

.item.url {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
