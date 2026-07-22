<script setup lang="ts">
import FontControls from '@/components/FontControls.vue';
import FontPreview from '@/components/FontPreview.vue';
import FontInfo from '@/components/FontInfo.vue';
import { useFontLoad } from '@/composables/useFontLoad';
import { useFontPreferences } from '@/composables/useFontPreferences';
import { t } from '@/utils/i18n';

const { loading, errorMessage, targetUrl, fontFamily, fileSize, format, load } = useFontLoad();
const { previewText, fontSize, bold, italic, darkBg } = useFontPreferences();

void load();
</script>

<template>
  <div id="app-fontviewer">
    <FontControls
      v-model:text="previewText"
      v-model:size="fontSize"
      v-model:bold="bold"
      v-model:italic="italic"
      v-model:dark-bg="darkBg"
    />

    <div id="content">
      <div v-if="loading" class="loader">{{ t('fontViewerLoading') }}</div>
      <div v-else-if="errorMessage" class="error">{{ errorMessage }}</div>
      <FontPreview
        v-else
        :family="fontFamily"
        :text="previewText"
        :size="fontSize"
        :bold="bold"
        :italic="italic"
        :dark-bg="darkBg"
      />
    </div>

    <FontInfo
      v-if="targetUrl && !errorMessage"
      :url="targetUrl.toString()"
      :format="format"
      :file-size="fileSize"
      :loading="loading"
    />
  </div>
</template>

<style>
#app-fontviewer {
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

.loader,
.error {
  padding: 20px;
}

.loader {
  font-style: italic;
}
</style>
