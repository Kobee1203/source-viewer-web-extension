<script setup lang="ts">
import { ref } from 'vue';
import { openNativeViewer } from '@/utils/nativeViewer';
import { t } from '@/utils/i18n';

const props = defineProps<{ url: URL; message: string }>();

const showFallback = ref(false);
const copied = ref(false);

async function openNative(): Promise<void> {
  // Navigation can fail (e.g. Illegal URL on Firefox for about: pages).
  const res = await openNativeViewer(props.url, false);
  if (!res?.ok) showFallback.value = true;
}

function copy(): void {
  void navigator.clipboard.writeText('view-source:' + props.url.toString()).then(() => {
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });
}
</script>

<template>
  <div class="error-box">
    <template v-if="!showFallback">
      <p class="error-message">{{ message }}</p>
      <button class="native-btn" @click="openNative">
        {{ t('viewerOpenNative') }}
      </button>
    </template>
    <template v-else>
      <p class="fallback-message">{{ t('errorRestrictedApi') }}</p>
      <div class="url-box">view-source:{{ url.toString() }}</div>
      <button class="copy-btn" :class="{ copied }" @click="copy">
        {{ copied ? t('viewerCopied') : t('viewerCopyUrl') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.error-box {
  padding: 20px;
  margin-top: 20px;
  text-align: center;
}

.error-message {
  margin-bottom: 15px;
  font-style: normal;
  line-height: 1.5;
}

.native-btn {
  padding: 10px 20px;
  font-size: 14px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  background-color: #007bff;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.native-btn:hover {
  background-color: #0056b3;
}

.fallback-message {
  margin-bottom: 15px;
  font-weight: bold;
  color: #ff4d4d;
}

.url-box {
  padding: 10px;
  margin-bottom: 15px;
  font-family: monospace;
  font-size: 12px;
  color: #d4d4d4;
  word-break: break-all;
  background: #222;
  border: 1px solid #444;
  border-radius: 4px;
}

.copy-btn {
  padding: 8px 16px;
  font-size: 13px;
  color: white;
  cursor: pointer;
  background-color: #6c757d;
  border: none;
  border-radius: 4px;
}

.copy-btn.copied {
  background-color: #28a745;
}
</style>
