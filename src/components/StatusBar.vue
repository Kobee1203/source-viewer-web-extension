<script setup lang="ts">
import { formatBytes } from '@/utils/format';
import { t } from '@/utils/i18n';

const props = defineProps<{ bytes: number }>();
</script>

<template>
  <div class="status-bar">
    {{ t('viewerPageSize', [formatBytes(props.bytes)]) }}
  </div>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 12px;
  font-size: 12px;
  color: var(--app-fg);
  user-select: none;
  background: var(--status-bg);
  border-top: 1px solid var(--status-border);
}
</style>
