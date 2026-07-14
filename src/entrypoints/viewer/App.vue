<script setup lang="ts">
import { computed, watch } from 'vue';
import Toolbar from '@/components/Toolbar.vue';
import CodeView from '@/components/CodeView.vue';
import StatusBar from '@/components/StatusBar.vue';
import ErrorView from '@/components/ErrorView.vue';
import { useSourceFetch } from '@/composables/useSourceFetch';
import { usePreferences } from '@/composables/usePreferences';
import { t } from '@/utils/i18n';
import { themeCssHref, getThemeType } from '@/utils/themes';

const {
  loading,
  errorMessage,
  errorWithNativeButton,
  code,
  language,
  byteSize,
  targetUrl,
  load,
} = useSourceFetch();

const { themeId, wordWrap } = usePreferences();

const baseUrl = computed(() => targetUrl.value?.toString() ?? '');

function applyTheme(id: string): void {
  const link = document.getElementById('theme-link') as HTMLLinkElement | null;
  if (link) link.href = themeCssHref(id);
  document.body.dataset.themeType = getThemeType(id);
}

watch(themeId, (id) => applyTheme(id), { immediate: true });

load();
</script>

<template>
  <Toolbar
    v-model:theme-id="themeId"
    v-model:word-wrap="wordWrap"
    :target-url="targetUrl"
  />

  <div id="content">
    <div v-if="loading" class="loader">{{ t('viewerLoading') }}</div>
    <ErrorView
      v-else-if="errorMessage && errorWithNativeButton && targetUrl"
      :url="targetUrl"
      :message="errorMessage"
    />
    <div v-else-if="errorMessage" class="loader">{{ errorMessage }}</div>
    <CodeView
      v-else
      :code="code"
      :language="language"
      :base-url="baseUrl"
      :wrap="wordWrap"
    />
  </div>

  <StatusBar v-if="byteSize !== null" :bytes="byteSize" />
</template>
