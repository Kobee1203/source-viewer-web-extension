<script setup lang="ts">
import { type Ref, computed, toValue } from 'vue';
import { formatBytes } from '@/utils/format';
import { t } from '@/utils/i18n';

export interface StatusBarSourceState {
  byteSize?: number | null | Ref<number | null>;
  httpStatus?: number | null | Ref<number | null>;
  httpStatusText?: string | Ref<string>;
  isLocalSnapshot?: boolean | Ref<boolean>;
  isDomFallback?: boolean | Ref<boolean>;
  isSourceTabClosed?: boolean | Ref<boolean>;
}

const props = defineProps<{
  source?: StatusBarSourceState;
  bytes?: number;
  httpStatus?: number | null;
  httpStatusText?: string;
  isLocalSnapshot?: boolean;
  isDomFallback?: boolean;
  isSourceTabClosed?: boolean;
  directoryName?: string | null;
}>();

const bytes = computed(() => toValue(props.source?.byteSize) ?? props.bytes ?? 0);
const httpStatus = computed(() => toValue(props.source?.httpStatus) ?? props.httpStatus ?? null);
const httpStatusText = computed(() => toValue(props.source?.httpStatusText) ?? props.httpStatusText ?? '');
const isLocalSnapshot = computed(() => toValue(props.source?.isLocalSnapshot) ?? props.isLocalSnapshot ?? false);
const isDomFallback = computed(() => toValue(props.source?.isDomFallback) ?? props.isDomFallback ?? false);
const isSourceTabClosed = computed(() => toValue(props.source?.isSourceTabClosed) ?? props.isSourceTabClosed ?? false);

const httpStatusClass = computed(() =>
  httpStatus.value != null && httpStatus.value >= 400 ? 'http-error' : 'http-success',
);

const httpStatusLabel = computed(() =>
  httpStatusText.value ? `HTTP ${httpStatus.value} - ${httpStatusText.value}` : `HTTP ${httpStatus.value}`,
);
</script>

<template>
  <div class="status-bar">
    <div class="status-left">
      <span v-if="httpStatusText || httpStatus != null" class="http-status" :class="[httpStatusClass]">
        {{ httpStatusLabel }}
      </span>
      <span v-if="directoryName" class="directory-badge" :title="t('viewerDirectoryBadge')">
        📁 {{ directoryName }}
      </span>
      <span v-if="isSourceTabClosed" class="snapshot-badge" :title="t('viewerBadgeTabClosedTooltip')">
        {{ t('viewerBadgeTabClosed') }}
      </span>
      <span v-else-if="isDomFallback" class="snapshot-badge" :title="t('viewerBadgeDomTooltip')">
        {{ t('viewerBadgeDomFallback') }}
      </span>
      <span v-else-if="isLocalSnapshot" class="snapshot-badge" :title="t('viewerSnapshotRefreshHint')">
        {{ t('viewerSnapshotBadge') }}
      </span>
    </div>
    <span class="page-size">{{ t('viewerPageSize', [formatBytes(bytes)]) }}</span>
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

.status-left {
  display: flex;
  gap: 8px;
  align-items: center;
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

.snapshot-badge {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--app-fg);
  cursor: help;
  background: var(--app-control-bg);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  opacity: 0.9;
}

.directory-badge {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 600;
  color: var(--app-fg);
  background: var(--app-control-bg);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}
</style>
