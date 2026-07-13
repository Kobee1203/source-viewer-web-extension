<script setup lang="ts">
import { formatBytes } from '../utils/format';
import { t } from '../utils/i18n';

const props = defineProps<{ bytes: number }>();
</script>

<template>
  <div class="status-bar">{{ t('viewerPageSize', [formatBytes(props.bytes)]) }}</div>
</template>
