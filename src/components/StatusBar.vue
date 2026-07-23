<script setup lang="ts">
import { computed } from 'vue';
import { formatBytes } from '@/utils/format';
import { t } from '@/utils/i18n';

const props = defineProps<{
  bytes: number;
  httpStatus?: number | null;
  httpStatusText?: string;
}>();

const httpStatus = computed(() =>
  props.httpStatus != null && props.httpStatus >= 400 ? 'http-error' : 'http-success',
);

const httpStatusLabel = computed(() =>
  props.httpStatusText ? `HTTP ${props.httpStatus} - ${props.httpStatusText}` : `HTTP ${props.httpStatus}`,
);
</script>

<template>
  <div class="status-bar">
    <span class="http-status" :class="[httpStatus]">{{ httpStatusLabel }}</span>
    <span class="page-size">{{ t('viewerPageSize', [formatBytes(props.bytes)]) }}</span>
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--app-fg);
  user-select: none;
  background: var(--statusbar-bg);
  border-top: 1px solid var(--statusbar-border);
}

.http-status {
  padding: 1px 8px;
  font-weight: 600;
  border-radius: 8px;
}

.http-status.http-success {
  color: #fff;
  background: var(--statusbar-http-status-success-bg);
}

.http-status.http-error {
  color: #fff;
  background: var(--statusbar-http-status-error-bg);
}
</style>
