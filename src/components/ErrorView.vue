<script setup lang="ts">
import { ref } from 'vue';
import { browser } from 'wxt/browser';
import { isRestricted } from '../utils/restricted';
import { t } from '../utils/i18n';

const props = defineProps<{ url: URL; message: string }>();

const showFallback = ref(false);
const copied = ref(false);

async function openNative(): Promise<void> {
  try {
    if (!isRestricted(props.url)) {
      props.url.searchParams.set('useNativeViewer', 'true');
    }
    await browser.tabs.update({ url: 'view-source:' + props.url.toString() });
  } catch {
    // Navigation can fail (e.g. Illegal URL on Firefox for about: pages).
    showFallback.value = true;
  }
}

function copy(): void {
  navigator.clipboard
    .writeText('view-source:' + props.url.toString())
    .then(() => {
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
        {{ copied ? 'Copied!' : 'Copy to clipboard' }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.error-box {
  text-align: center;
  margin-top: 20px;
  padding: 20px;
}
.error-message {
  margin-bottom: 15px;
  font-style: normal;
  line-height: 1.5;
}
.native-btn {
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
  transition: background-color 0.2s;
}
.native-btn:hover {
  background-color: #0056b3;
}
.fallback-message {
  margin-bottom: 15px;
  color: #ff4d4d;
  font-weight: bold;
}
.url-box {
  background: #222;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  border: 1px solid #444;
  color: #d4d4d4;
}
.copy-btn {
  padding: 8px 16px;
  background-color: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.copy-btn.copied {
  background-color: #28a745;
}
</style>
