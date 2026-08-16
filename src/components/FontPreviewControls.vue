<script setup lang="ts">
import { ref, watch } from 'vue';
import { Bold, Italic, Sun, Moon } from '@lucide/vue';
import IconButton from '@/components/IconButton.vue';
import { useWritingSystems } from '@/composables/useWritingSystems';
import { t } from '@/utils/i18n';

// Loaded font's family name, used to detect which writing systems it actually covers.
const props = defineProps<{ family: string }>();

// Two-way bound preview settings, owned by the font viewer's App (forwarded via FontControls).
const text = defineModel<string>('text', { required: true });
const size = defineModel<number>('size', { required: true });
const bold = defineModel<boolean>('bold', { required: true });
const italic = defineModel<boolean>('italic', { required: true });
const darkBg = defineModel<boolean>('darkBg', { required: true });

// The dropdown only lists scripts the loaded font actually covers, and is hidden entirely when
// there's at most one (a single-script font makes the picker pointless).
const { available } = useWritingSystems(() => props.family);
const selectedScript = ref('');

// Keep the selection valid as `available` changes (e.g. once the font finishes loading), without
// touching the preview text — only an explicit user pick (the @change handler below) does that.
watch(
  available,
  (list) => {
    if (!list.some((ws) => ws.id === selectedScript.value)) {
      selectedScript.value = list[0]?.id ?? '';
    }
  },
  { immediate: true },
);

function onScriptChange(): void {
  const ws = available.value.find((w) => w.id === selectedScript.value);
  if (ws) text.value = ws.sample;
}
</script>

<template>
  <div class="preview-controls">
    <select
      v-if="available.length > 1"
      v-model="selectedScript"
      class="script-select"
      :aria-label="t('fontViewerScript')"
      :title="t('fontViewerScript')"
      @change="onScriptChange"
    >
      <option v-for="ws in available" :key="ws.id" :value="ws.id">{{ t(ws.labelKey) }}</option>
    </select>

    <input
      v-model="text"
      type="text"
      name="preview"
      class="preview-input"
      :placeholder="t('fontViewerPreviewLabel')"
      :aria-label="t('fontViewerPreviewLabel')"
    />

    <span class="spacer"></span>

    <label class="size-control" :title="t('fontViewerSize')">
      <input v-model.number="size" type="range" min="8" max="200" step="1" :aria-label="t('fontViewerSize')" />
      <span class="size-value">{{ size }}px</span>
    </label>

    <span class="sep"></span>

    <IconButton :active="bold" :label="t('fontViewerBold')" @click="bold = !bold">
      <Bold :size="20" />
    </IconButton>

    <IconButton :active="italic" :label="t('fontViewerItalic')" @click="italic = !italic">
      <Italic :size="20" />
    </IconButton>

    <IconButton :active="darkBg" :label="t('fontViewerBackground')" @click="darkBg = !darkBg">
      <component :is="darkBg ? Sun : Moon" :size="20" />
    </IconButton>
  </div>
</template>

<style scoped>
/* Fills the toolbar space beside the view switch; internal spacer splits left/right groups
   (.spacer/.sep are shared globals — see src/styles/toolbar.css). */
.preview-controls {
  display: flex;
  flex: 1 1 auto;
  gap: 8px;
  align-items: center;
}

.script-select {
  flex: 0 0 auto;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  cursor: pointer;
  outline: none;
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.preview-input {
  flex: 1 1 auto;
  min-width: 120px;
  max-width: 480px;
  height: 32px;
  padding: 0 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--select-fg);
  outline: none;
  background: var(--select-bg);
  border: 1px solid var(--select-border);
  border-radius: 5px;
}

.size-control {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.size-value {
  min-width: 44px;
  font-size: 13px;
  text-align: right;
}
</style>
