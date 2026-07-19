<script setup lang="ts">
import { computed } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import CodeView from '@/components/CodeView.vue';
import StatusBar from '@/components/StatusBar.vue';
import ErrorView from '@/components/ErrorView.vue';
import { useSourceFetch } from '@/composables/useSourceFetch';
import { usePreferences } from '@/composables/usePreferences';
import { t } from '@/utils/i18n';
import { getThemeType } from '@/utils/themes';

const { loading, errorMessage, errorWithNativeButton, code, language, byteSize, targetUrl, load } = useSourceFetch();

const { themeId, wordWrap } = usePreferences();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');

const themeType = computed(() => getThemeType(themeId.value));

void load();
</script>

<template>
  <div id="app-viewer" :data-theme-type="themeType">
    <Toolbar v-model:theme-id="themeId" v-model:word-wrap="wordWrap" :target-url="targetUrl" />

    <div id="content">
      <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
      <ErrorView
        v-else-if="errorMessage && errorWithNativeButton && targetUrl"
        :url="targetUrl"
        :message="errorMessage"
      />
      <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
      <CodeView v-else :code="code" :language="language" :base-url="baseUrl" :wrap="wordWrap" :theme-id="themeId" />
    </div>

    <StatusBar v-if="byteSize !== null" :bytes="byteSize" />
  </div>
</template>

<style>
#app-viewer[data-theme-type='light'] {
  --app-bg: #f5f2f0;
  --app-fg: #000;
  --toolbar-bg: #ddd;
  --toolbar-border: #ccc;
  --select-bg: #fff;
  --select-fg: #000;
  --select-border: #aaa;
  --status-bg: #ddd;
  --status-border: #ccc;
  --btn-bg: #fff;
  --btn-bg-hover: #eee;
  --btn-border: #aaa;
  --btn-active-bg: #cfe6ff;
  --btn-active-border: #7fb6ff;
  --btn-active-fg: #003a6b;
}

#app-viewer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  margin: 0;
}

#content {
  flex: 1;
  overflow: auto;
  background: inherit;
}

.loader {
  padding: 20px;
  font-style: italic;
}
</style>
