<script setup lang="ts">
import { ref } from 'vue';
import LocalDropZone from '@/components/LocalDropZone.vue';
import { useCopyFeedback } from '@/composables/useCopyFeedback';
import { t } from '@/utils/i18n';
import { openNativeViewer } from '@/utils/nativeViewer';

const props = defineProps<{
  url?: URL | null;
  message: string;
  fileAccessDenied?: boolean;
}>();

const emit = defineEmits<{
  'file-selected': [file: File, handle?: FileSystemFileHandle];
}>();

const showFallback = ref(false);
const { copied, copy } = useCopyFeedback<boolean>(2000);

async function openNative(): Promise<void> {
  if (!props.url) return;
  // Navigation can fail (e.g. Illegal URL on Firefox for about: pages).
  const res = await openNativeViewer(props.url, false);
  if (!res?.ok) showFallback.value = true;
}
</script>

<template>
  <div class="error-box">
    <!-- File scheme permission denied error -->
    <template v-if="fileAccessDenied">
      <div class="file-help-card">
        <h2 class="file-help-title">{{ message }}</h2>
        <p class="file-help-desc">{{ t('fileSchemePermissionHelp') }}</p>
        <ol class="file-help-steps">
          <li>{{ t('fileSchemeStep1') }}</li>
          <li>{{ t('fileSchemeStep2') }}</li>
        </ol>
      </div>
      <div class="drop-container">
        <LocalDropZone @file-selected="(file, handle) => emit('file-selected', file, handle)" />
      </div>
    </template>

    <!-- Generic error with native viewer button -->
    <template v-else-if="!showFallback">
      <p class="error-message">{{ message }}</p>
      <button v-if="url" class="native-btn" @click="openNative">
        {{ t('viewerOpenNative') }}
      </button>
    </template>

    <!-- Fallback message for restricted URLs -->
    <template v-else-if="url">
      <p class="fallback-message">{{ t('errorRestrictedApi') }}</p>
      <div class="url-box">view-source:{{ url.toString() }}</div>
      <button class="copy-btn" :class="{ copied }" @click="copy('view-source:' + url.toString(), true)">
        {{ copied ? t('viewerCopied') : t('viewerCopyUrl') }}
      </button>
    </template>
  </div>
</template>

<style scoped>
.error-box {
  max-width: 680px;
  padding: 24px;
  margin: 20px auto;
  text-align: center;
}

.error-message {
  margin-bottom: 15px;
  font-style: normal;
  line-height: 1.5;
}

.file-help-card {
  padding: 20px;
  margin-bottom: 24px;
  text-align: left;
  background: var(--app-control-bg);
  border: 1px solid var(--app-border);
  border-radius: 8px;
}

.file-help-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #ff4d4d;
}

.file-help-desc {
  margin: 0 0 12px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--app-fg);
}

.file-help-steps {
  padding-left: 20px;
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--app-fg);
}

.drop-container {
  max-width: 600px;
  margin: 0 auto;
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
