<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  family: string;
  text: string;
  size: number;
  bold: boolean;
  italic: boolean;
  darkBg: boolean;
}>();

const previewStyle = computed(() => ({
  fontFamily: props.family ? `'${props.family}', sans-serif` : 'sans-serif',
  fontSize: `${props.size}px`,
  fontWeight: props.bold ? '700' : '400',
  fontStyle: props.italic ? 'italic' : 'normal',
}));
</script>

<template>
  <div class="font-preview" :class="{ dark: darkBg }">
    <div class="preview-text" :style="previewStyle">{{ text }}</div>
  </div>
</template>

<style scoped>
.font-preview {
  height: 100%;
  padding: 24px;
  overflow: auto;
  color: #111;
  background: #fff;
}

.font-preview.dark {
  color: #eee;
  background: #1e1e1e;
}

.preview-text {
  line-height: 1.3;
  overflow-wrap: break-word;
}
</style>
