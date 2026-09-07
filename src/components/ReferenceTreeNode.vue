<script lang="ts">
// Explicit name required so the SFC can reference itself recursively in its own template.
export default { name: 'ReferenceTreeNode' };
</script>

<script setup lang="ts">
import { inject } from 'vue';
import { ArrowUpRight, ChevronDown, ChevronRight, Folder, FolderOpen, Loader } from '@lucide/vue';
import type { ReferenceEntry, VfsFileNode, VfsFolderNode, VfsNode } from '@/composables/useReferenceSidebar';
import type { FileType } from '@/utils/fileType';

defineProps<{ node: VfsNode }>();

// Callbacks and active URL are provided by ReferenceSidebar to avoid prop drilling
// through arbitrarily deep recursive trees.
const activeUrl = inject<() => string>('sidebarActiveUrl')!;
const onNavigate = inject<(node: VfsNode) => void>('sidebarNavigate')!;
const onNavigateShortcut = inject<(ref: ReferenceEntry) => void>('sidebarNavigateShortcut')!;
const onToggleFolder = inject<(node: VfsFolderNode) => void>('sidebarToggleFolder')!;
const onToggleFile = inject<(node: VfsFileNode) => void>('sidebarToggleFile')!;

// ── File type display ────────────────────────────────────────────────────────

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

function badgeLabel(item: { linkTarget: 'source' | 'font' | null; fileType?: FileType | null }): string {
  if (item.linkTarget === 'font') return 'FONT';
  if (item.fileType) return FILE_TYPE_LABELS[item.fileType];
  return 'SRC';
}

function badgeColor(item: { linkTarget: 'source' | 'font' | null; fileType?: FileType | null }): string {
  if (item.linkTarget === 'font') return '#7b1fa2';
  if (item.fileType) return FILE_TYPE_COLORS[item.fileType];
  return '#607d8b';
}

// ── File node chevron visibility & click ─────────────────────────────────────

/**
 * Show a chevron on a file node when:
 *   - It is a source file (fonts open in a new tab — no explore concept)
 *   - AND it has not yet been explored, is loading, or has known references.
 */
function showFileChevron(node: VfsFileNode): boolean {
  return node.linkTarget === 'source' && (node.isLoading || !node.isExplored || node.hasReferences === true);
}

function onFileChevronClick(node: VfsFileNode): void {
  if (node.isLoading) return;
  if (node.isExplored && node.hasReferences) {
    onToggleFile(node);
  } else if (!node.isExplored) {
    onNavigate(node);
  }
}

function nodeKey(n: VfsNode): string {
  return n.kind === 'file' ? `f:${n.url}` : `d:${n.key}`;
}
</script>

<template>
  <!-- ── Folder node ─────────────────────────────────────────────────── -->
  <li v-if="node.kind === 'folder'" class="vfs-node canonical-node" :data-vfs-url="node.url ?? undefined">
    <div class="node-row" :class="{ active: node.url !== null && node.url === activeUrl() }">
      <!-- Expand / collapse chevron (only if folder has children) -->
      <button
        v-if="node.children.length > 0"
        type="button"
        class="chevron-btn"
        :aria-expanded="node.isExpanded"
        @click.stop="onToggleFolder(node)"
      >
        <ChevronDown v-if="node.isExpanded" :size="14" />
        <ChevronRight v-else :size="14" />
      </button>
      <span v-else class="chevron-placeholder" />

      <!-- Folder icon -->
      <FolderOpen v-if="node.isExpanded" :size="14" class="folder-icon" />
      <Folder v-else :size="14" class="folder-icon" />

      <!--
        Folder name:
          - Has URL → navigate on click (domain-root / trailing-slash dir / root-domain folder)
          - No URL  → toggle expand/collapse on click (intermediate path segment)
      -->
      <button v-if="node.url" type="button" class="node-name-btn" :title="node.url" @click="onNavigate(node)">
        {{ node.name }}
      </button>
      <button v-else type="button" class="node-name-btn node-name-btn-toggle" @click="onToggleFolder(node)">
        {{ node.name }}
      </button>
    </div>

    <!-- Recursive children -->
    <ul v-if="node.isExpanded && node.children.length > 0" class="child-list">
      <ReferenceTreeNode v-for="child in node.children" :key="nodeKey(child)" :node="child" />
    </ul>
  </li>

  <!-- ── File node ───────────────────────────────────────────────────── -->
  <li v-else class="vfs-node canonical-node" :class="{ active: node.url === activeUrl() }" :data-vfs-url="node.url">
    <div class="node-row">
      <!-- Explore / collapse chevron / loading spinner -->
      <button
        v-if="showFileChevron(node)"
        type="button"
        class="chevron-btn"
        :title="node.isExplored && node.hasReferences ? undefined : node.url"
        :aria-expanded="node.isExplored && node.hasReferences ? node.isExpanded : undefined"
        @click.stop="onFileChevronClick(node)"
      >
        <Loader v-if="node.isLoading" :size="14" class="spin" />
        <template v-else-if="node.isExplored && node.hasReferences">
          <ChevronDown v-if="node.isExpanded" :size="14" />
          <ChevronRight v-else :size="14" />
        </template>
        <ChevronRight v-else :size="14" />
      </button>
      <span v-else class="chevron-placeholder" />

      <!-- File type badge -->
      <span class="ft-badge" :style="{ background: badgeColor(node) }">
        {{ badgeLabel(node) }}
      </span>

      <!-- Filename (also navigates on click) -->
      <button type="button" class="node-name-btn" :title="node.url" @click="onNavigate(node)">
        {{ node.name }}
      </button>

      <!-- Occurrence count badge (shown when referenced more than once) -->
      <span v-if="node.count > 1" class="count-badge">×{{ node.count }}</span>
    </div>

    <!-- Direct references list (shortcuts) -->
    <ul v-if="node.isExpanded && node.references.length > 0" class="child-list">
      <li
        v-for="ref in node.references"
        :key="`ref:${ref.url}`"
        class="vfs-node shortcut-node"
        :class="{ active: ref.url === activeUrl() }"
        data-vfs-shortcut="true"
        :data-vfs-url="ref.url"
      >
        <div class="node-row" @click="onNavigateShortcut(ref)">
          <span class="chevron-placeholder" />

          <!-- Shortcut badge (Option B) -->
          <span class="ft-badge ft-badge-shortcut" :style="{ borderColor: badgeColor(ref), color: badgeColor(ref) }">
            <ArrowUpRight :size="10" class="shortcut-arrow" />
            {{ badgeLabel(ref) }}
          </span>

          <!-- Filename button -->
          <button type="button" class="node-name-btn" :title="ref.url">
            {{ ref.filename }}
          </button>

          <!-- Occurrence count badge -->
          <span v-if="ref.count > 1" class="count-badge">×{{ ref.count }}</span>
        </div>
      </li>
    </ul>
  </li>
</template>

<style scoped>
.vfs-node {
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

.folder-icon {
  flex-shrink: 0;
  color: var(--app-fg);
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

.ft-badge-shortcut {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 0 3px;
  font-size: 9px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0.03em;
  background: color-mix(in srgb, currentcolor 12%, transparent);
  border: 1px dashed currentcolor;
  border-radius: 3px;
}

.shortcut-arrow {
  flex-shrink: 0;
}

.shortcut-node .node-row {
  cursor: pointer;
}

.node-name-btn {
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

/* Non-navigable folders: name button only toggles, no URL underline hint */
.node-name-btn-toggle {
  cursor: default;
}

/* Active clickable folder highlight */
.node-row.active {
  background: var(--btn-active-bg);
}

.node-row.active .node-name-btn {
  font-weight: 600;
  color: var(--btn-active-fg);
}

/* Active file node highlight */
.vfs-node.active > .node-row {
  background: var(--btn-active-bg);
}

.vfs-node.active > .node-row .node-name-btn {
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

.child-list {
  padding: 0;
  padding-left: 20px;
  margin: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes target-pulse {
  0% {
    box-shadow: inset 0 0 0 2px var(--btn-active-border);
  }

  100% {
    box-shadow: inset 0 0 0 2px transparent;
  }
}

.node-row.highlight-pulse {
  animation: target-pulse 1.5s ease-out;
}
</style>
