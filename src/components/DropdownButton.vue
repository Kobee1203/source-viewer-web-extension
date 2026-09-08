<script setup lang="ts">
import { type Component, onMounted, onUnmounted, ref } from 'vue';
import { ChevronDown } from '@lucide/vue';

export interface DropdownMenuItem {
  label: string;
  icon?: Component;
  onSelect?: (e: Event) => void;
}

defineProps<{
  items: DropdownMenuItem[];
  label: string;
}>();

const isOpen = ref(false);
const containerRef = ref<HTMLElement | null>(null);

function close(): void {
  isOpen.value = false;
}

function toggle(): void {
  isOpen.value = !isOpen.value;
}

function handleSelect(event: Event, item: DropdownMenuItem): void {
  close();
  item.onSelect?.(event);
}

function onDocumentClick(event: MouseEvent): void {
  if (
    isOpen.value &&
    containerRef.value &&
    event.target instanceof Node &&
    !containerRef.value.contains(event.target)
  ) {
    close();
  }
}

function onDocumentKeydown(event: KeyboardEvent): void {
  if (isOpen.value && event.key === 'Escape') {
    close();
  }
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});

defineExpose({ close, open: () => (isOpen.value = true) });
</script>

<template>
  <div ref="containerRef" class="split-btn">
    <slot />
    <button
      type="button"
      class="split-btn-toggle"
      :class="{ active: isOpen }"
      :title="label"
      :aria-label="label"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <ChevronDown :size="14" />
    </button>

    <ul v-if="isOpen" class="dropdown-menu" role="menu">
      <li v-for="(item, index) in items" :key="index" role="none">
        <button type="button" class="dropdown-item" role="menuitem" @click="handleSelect($event, item)">
          <component :is="item.icon" v-if="item.icon" :size="16" class="dropdown-item-icon" />
          <span>{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.split-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
}

:slotted(button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0;
  color: var(--app-fg);
  cursor: pointer;
  outline: none;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 5px 0 0 5px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}

:slotted(button:hover) {
  z-index: 1;
  background: var(--btn-bg-hover);
}

.split-btn-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 32px;
  padding: 0;
  margin-left: -1px;
  color: var(--app-fg);
  cursor: pointer;
  outline: none;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  transition:
    background-color 0.15s,
    border-color 0.15s,
    color 0.15s;
}

.split-btn-toggle:hover {
  z-index: 1;
  background: var(--btn-bg-hover);
}

.split-btn-toggle.active {
  z-index: 1;
  color: var(--btn-active-fg);
  background: var(--btn-active-bg);
  border-color: var(--btn-active-border);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 100;
  min-width: 210px;
  padding: 4px 0;
  margin: 0;
  list-style: none;
  background: var(--dialog-bg);
  border: 1px solid var(--dialog-border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgb(0 0 0 / 30%);
}

.dropdown-item {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  height: 32px;
  padding: 0 12px;
  font-family: inherit;
  font-size: 13px;
  color: var(--app-fg);
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  outline: none;
  background: transparent;
  border: none;
}

.dropdown-item:hover,
.dropdown-item:focus-visible {
  background: var(--btn-bg-hover);
}

.dropdown-item-icon {
  flex-shrink: 0;
  color: var(--app-fg);
  opacity: 0.8;
}
</style>
