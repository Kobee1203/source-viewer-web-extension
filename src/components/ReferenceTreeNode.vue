<script lang="ts">
// Explicit name registration is required for a component to reference itself recursively
// in its own template via the same tag name in Vue 3 <script setup>.
export default { name: 'ReferenceTreeNode' };
</script>

<script setup lang="ts">
import { inject } from 'vue';
import { ChevronDown, ChevronRight, Loader } from '@lucide/vue';
import type { ReferenceNode } from '@/composables/useReferenceSidebar';
import type { FileType } from '@/utils/fileType';

defineProps<{ node: ReferenceNode }>();

// Callbacks and active URL are provided by ReferenceSidebar to avoid prop drilling
// through arbitrarily deep recursive trees.
const activeUrl = inject<() => string>('sidebarActiveUrl')!;
const onNavigate = inject<(node: ReferenceNode) => void>('sidebarNavigate')!;
const onToggleExpand = inject<(node: ReferenceNode) => void>('sidebarToggleExpand')!;

const FILE_TYPE_LABELS: Record<FileType, string> = {
  html: 'HTML',
  css: 'CSS',
  javascript: 'JS',
  json: 'JSON',
  xml: 'XML',
};

const FILE_TYPE_COLORS: Record<FileType, string> = {
  html: '#e44d26',
  css: '#264de4',
  javascript: '#c59300',
  json: '#4a4a4a',
  xml: '#2e7d32',
};

function badgeLabel(node: ReferenceNode): string {
  if (node.linkTarget === 'font') return 'FONT';
  if (node.fileType) return FILE_TYPE_LABELS[node.fileType];
  return 'SRC';
}

function badgeColor(node: ReferenceNode): string {
  if (node.linkTarget === 'font') return '#7b1fa2';
  if (node.fileType) return FILE_TYPE_COLORS[node.fileType];
  return '#607d8b';
}

function hasToggle(node: ReferenceNode): boolean {
  return node.isLoading || (node.children !== null && node.linkTarget !== 'font');
}
</script>

<template>
  <li class="tree-node" :class="{ active: node.url === activeUrl(), circular: node.isCircular }">
    <div class="node-row">
      <!-- Expand / collapse chevron -->
      <button
        v-if="hasToggle(node)"
        type="button"
        class="chevron-btn"
        :aria-expanded="node.isExpanded"
        @click.stop="onToggleExpand(node)"
      >
        <Loader v-if="node.isLoading" :size="14" class="spin" />
        <ChevronDown v-else-if="node.isExpanded" :size="14" />
        <ChevronRight v-else :size="14" />
      </button>
      <span v-else class="chevron-placeholder" />

      <!-- File type badge -->
      <span class="ft-badge" :style="{ background: badgeColor(node) }">{{ badgeLabel(node) }}</span>

      <!-- Filename (clickable) -->
      <button
        type="button"
        class="filename-btn"
        :title="node.url"
        :disabled="node.isCircular"
        @click="onNavigate(node)"
      >
        {{ node.filename }}
      </button>

      <!-- Occurrence badge (shown when referenced more than once) -->
      <span v-if="node.count > 1" class="count-badge">×{{ node.count }}</span>

      <!-- Circular reference indicator -->
      <span v-if="node.isCircular" class="circular-label">↩</span>
    </div>

    <!-- Recursive children -->
    <ul v-if="node.isExpanded && node.children && node.children.length > 0" class="child-list">
      <ReferenceTreeNode v-for="child in node.children" :key="child.url" :node="child" />
    </ul>
    <div v-else-if="node.isExpanded && node.children && node.children.length === 0" class="no-children">—</div>
  </li>
</template>

<style scoped>
.tree-node {
  padding: 0;
  margin: 0;
  list-style: none;
}

.node-row {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 3px 6px;
  cursor: default;
  border-radius: 4px;
}

.node-row:hover {
  background: var(--btn-bg-hover);
}

.chevron-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  color: inherit;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 3px;
  opacity: 0.7;
}

.chevron-btn:hover {
  background: var(--btn-bg);
  opacity: 1;
}

.chevron-placeholder {
  display: inline-block;
  flex-shrink: 0;
  width: 16px;
}

.ft-badge {
  flex-shrink: 0;
  padding: 1px 4px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.5;
  color: #fff;
  letter-spacing: 0.03em;
  border-radius: 3px;
}

.filename-btn {
  flex: 1;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: inherit;
  font-size: 12px;
  color: var(--app-fg);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  background: none;
  border: none;
}

.filename-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.tree-node.active > .node-row {
  color: var(--btn-active-fg);
  background: var(--btn-active-bg);
}

.tree-node.active > .node-row .filename-btn {
  font-weight: 600;
  color: var(--btn-active-fg);
}

.count-badge {
  flex-shrink: 0;
  padding: 0 4px;
  font-size: 10px;
  color: var(--app-fg);
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 10px;
  opacity: 0.8;
}

.circular-label {
  flex-shrink: 0;
  font-size: 11px;
  cursor: help;
  opacity: 0.55;
}

.child-list {
  padding: 0;
  padding-left: 20px;
  margin: 0;
}

.no-children {
  padding-left: 36px;
  font-size: 11px;
  opacity: 0.4;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}
</style>
