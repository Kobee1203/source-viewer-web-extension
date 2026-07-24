<script setup lang="ts">
/**
 * Toolbar icon button, shared by the code viewer and font viewer toolbars.
 * `active` marks a toggle button as pressed; omit it for a plain action button.
 * `label` sets both `title` and `aria-label`, since every caller uses the same string for both.
 * Any other listener (e.g. `@click`, `@auxclick`) falls through to the root `<button>`.
 */
defineProps<{ active?: boolean; label: string }>();
</script>

<template>
  <button type="button" class="icon-btn" :class="{ active }" :aria-pressed="active" :title="label" :aria-label="label">
    <slot />
  </button>
</template>

<style scoped>
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  color: var(--app-fg);
  cursor: pointer;
  background: var(--btn-bg);
  border: 1px solid var(--btn-border);
  border-radius: 5px;
}

.icon-btn:hover {
  background: var(--btn-bg-hover);
}

.icon-btn.active {
  color: var(--btn-active-fg);
  background: var(--btn-active-bg);
  border-color: var(--btn-active-border);
}
</style>
