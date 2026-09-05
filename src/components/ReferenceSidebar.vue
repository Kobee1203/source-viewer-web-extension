<script setup lang="ts">
import { provide, ref } from 'vue';
import { X } from '@lucide/vue';
import ReferenceTreeNode from '@/components/ReferenceTreeNode.vue';
import type { ReferenceNode } from '@/composables/useReferenceSidebar';
import { t } from '@/utils/i18n';

const props = defineProps<{
  roots: ReferenceNode[];
  activeUrl: string;
  rootUrl: string;
  rootFilename: string;
}>();

const emit = defineEmits<{
  navigate: [node: ReferenceNode];
  'navigate-root': [];
  'toggle-expand': [node: ReferenceNode];
  close: [];
}>();

// Provide callbacks and activeUrl down to all ReferenceTreeNode descendants
// to avoid prop-drilling through arbitrarily deep recursive trees.
provide('sidebarActiveUrl', () => props.activeUrl);
provide('sidebarNavigate', (node: ReferenceNode) => emit('navigate', node));
provide('sidebarToggleExpand', (node: ReferenceNode) => emit('toggle-expand', node));

// Resize logic — updates a CSS custom property on the sidebar element
const sidebarEl = ref<HTMLElement | null>(null);
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 160;

function onResizePointerDown(event: PointerEvent): void {
  const handle = event.currentTarget as HTMLElement;
  handle.setPointerCapture(event.pointerId);

  const startX = event.clientX;
  const startWidth = sidebarEl.value?.offsetWidth ?? DEFAULT_WIDTH;

  function onMove(e: PointerEvent): void {
    const newWidth = Math.max(MIN_WIDTH, startWidth + (e.clientX - startX));
    sidebarEl.value?.style.setProperty('--sidebar-width', `${newWidth}px`);
  }

  function onUp(): void {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
  }

  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
}
</script>

<template>
  <aside
    ref="sidebarEl"
    class="reference-sidebar"
    :style="{ '--sidebar-width': `${DEFAULT_WIDTH}px` }"
    :aria-label="t('sidebarTitle')"
  >
    <!-- Header -->
    <div class="sidebar-header">
      <span class="sidebar-title">{{ t('sidebarTitle') }}</span>
      <button
        type="button"
        class="close-btn"
        :title="t('dialogClose')"
        :aria-label="t('dialogClose')"
        @click="emit('close')"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- Root file breadcrumb (only shown when navigated away from root) -->
    <div v-if="rootUrl && activeUrl !== rootUrl" class="root-crumb">
      <button type="button" class="root-crumb-btn" :title="rootUrl" @click="emit('navigate-root')">
        ← {{ rootFilename }}
      </button>
    </div>

    <!-- Tree -->
    <div class="sidebar-body">
      <ul v-if="roots.length > 0" class="root-list">
        <ReferenceTreeNode v-for="node in roots" :key="node.url" :node="node" />
      </ul>
      <div v-else class="sidebar-empty">{{ t('sidebarEmpty') }}</div>
    </div>

    <!-- Resize handle -->
    <div class="resize-handle" @pointerdown="onResizePointerDown" />
  </aside>
</template>

<style scoped>
.reference-sidebar {
  position: relative;
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  width: var(--sidebar-width, 260px);
  min-width: 160px;
  overflow: hidden;
  background: var(--toolbar-bg);
  border-right: 1px solid var(--toolbar-border);
}

.sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--toolbar-border);
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.7;
}

.close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--app-fg);
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 3px;
  opacity: 0.6;
}

.close-btn:hover {
  background: var(--btn-bg-hover);
  opacity: 1;
}

.root-crumb {
  flex-shrink: 0;
  padding: 4px 8px;
  border-bottom: 1px solid var(--toolbar-border);
}

.root-crumb-btn {
  max-width: 100%;
  padding: 2px 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: inherit;
  font-size: 11px;
  color: var(--app-fg);
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 3px;
  opacity: 0.75;
}

.root-crumb-btn:hover {
  background: var(--btn-bg-hover);
  opacity: 1;
}

.sidebar-body {
  flex: 1;
  padding: 4px 0;
  overflow-y: auto;
}

.root-list {
  padding: 0;
  margin: 0;
}

.sidebar-empty {
  padding: 12px 14px;
  font-size: 12px;
  font-style: italic;
  opacity: 0.5;
}

/* Resize handle — thin bar on the right edge */
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
}

.resize-handle:hover,
.resize-handle:active {
  background: var(--btn-active-border);
}
</style>
