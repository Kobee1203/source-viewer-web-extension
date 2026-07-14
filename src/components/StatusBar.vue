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
  padding: 6px 12px;
  background: var(--status-bg);
  font-size: 12px;
  border-top: 1px solid var(--status-border);
  color: var(--app-fg);
  display: flex;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
}
</style>
