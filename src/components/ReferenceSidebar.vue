<script setup lang="ts">
import { provide, ref } from 'vue';
import { X } from '@lucide/vue';
import ReferenceTreeNode from '@/components/ReferenceTreeNode.vue';
import type { VfsFolderNode, VfsNode } from '@/composables/useReferenceSidebar';
import { t } from '@/utils/i18n';

const props = defineProps<{
  vfsTree: VfsNode[];
  activeUrl: string;
}>();

const emit = defineEmits<{
  navigate: [node: VfsNode];
  'toggle-folder': [node: VfsFolderNode];
  close: [];
}>();

provide<() => string>('sidebarActiveUrl', () => props.activeUrl);
provide<(node: VfsNode) => void>('sidebarNavigate', (node) => emit('navigate', node));
provide<(node: VfsFolderNode) => void>('sidebarToggleFolder', (node) => emit('toggle-folder', node));

// ── Resize logic ──────────────────────────────────────────────────────────────
const sidebarEl = ref<HTMLElement | null>(null);
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 160;
const defaultWidth = `${DEFAULT_WIDTH}px`;
const minWidth = `${MIN_WIDTH}px`;

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

/** True when the first VFS node is the root-domain folder (always the case once seeded). */
function hasSeparator(): boolean {
  const first = props.vfsTree[0];
  return props.vfsTree.length > 1 && first?.kind === 'folder' && first.isRootDomain;
}

function nodeKey(node: VfsNode): string {
  return node.kind === 'file' ? `f:${node.url}` : `d:${node.key}`;
}
</script>

<template>
  <aside ref="sidebarEl" class="reference-sidebar" :aria-label="t('sidebarTitle')">
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

    <!-- VFS tree -->
    <div class="sidebar-body">
      <ul v-if="vfsTree.length > 0" class="root-list">
        <template v-for="(node, idx) in vfsTree" :key="nodeKey(node)">
          <!--
            Separator between the root-domain folder (index 0) and external
            domain folders (index 1+). Only rendered once, between both groups.
          -->
          <li v-if="idx === 1 && hasSeparator()" class="tree-separator" role="separator" />
          <ReferenceTreeNode :node="node" />
        </template>
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
  width: var(--sidebar-width, v-bind(defaultWidth));
  min-width: v-bind(minWidth);
  overflow: hidden;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
}

.sidebar-header {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 1px solid var(--sidebar-border);
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

/* Visual separator between root-domain folder and external domain folders */
.tree-separator {
  height: 1px;
  margin: 4px 8px;
  list-style: none;
  background: var(--sidebar-border);
  opacity: 0.6;
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
