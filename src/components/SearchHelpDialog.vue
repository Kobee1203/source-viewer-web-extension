<script setup lang="ts">
import { onMounted, ref } from 'vue';
import type { StructuralSearchProvider } from '@/composables/search/StructuralSearchProvider';
import { t } from '@/utils/i18n';
import Dialog from './Dialog.vue';

defineProps<{
  activeProvider: StructuralSearchProvider;
  title: string;
}>();

const emit = defineEmits(['closed']);

const dialogRef = ref<{ open: () => void; close: () => void } | null>(null);

onMounted(() => {
  // Automatically open when instantiated via v-if
  dialogRef.value?.open();
});

function onClosed() {
  emit('closed');
}
</script>

<template>
  <Dialog ref="dialogRef" :title="title" @close="onClosed">
    <p v-if="activeProvider.helpUrl">
      <a :href="activeProvider.helpUrl" target="_blank" rel="noopener noreferrer">
        {{ t('searchOfficialDocs') }}
      </a>
    </p>
    <table v-if="activeProvider.examples" class="help-examples">
      <tbody>
        <tr v-for="ex in activeProvider.examples" :key="ex.query">
          <td>
            <code>{{ ex.query }}</code>
          </td>
          <td>{{ t(ex.descriptionKey) }}</td>
        </tr>
      </tbody>
    </table>
  </Dialog>
</template>

<style scoped>
.dialog-content a {
  color: var(--dialog-link);
  text-decoration: underline;
}

.help-examples {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
}

.help-examples td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--dialog-border);
}

.help-examples code {
  padding: 2px 4px;
  font-family: Consolas, Monaco, monospace;
  background: var(--dialog-bg-alt);
  border-radius: 4px;
}
</style>
