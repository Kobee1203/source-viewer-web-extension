<script setup lang="ts">
/**
 * A brief, non-blocking confirmation message pinned to the bottom-center of the viewport.
 * Fades in/out with `show` and announces itself to assistive tech (`role="status"`).
 * Content is provided via the default slot.
 */
defineProps<{ show: boolean }>();
</script>

<template>
  <Transition name="toast">
    <div v-if="show" class="toast" role="status" aria-live="polite">
      <slot />
    </div>
  </Transition>
</template>

<style scoped>
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--btn-active-fg);
  pointer-events: none;
  background: var(--btn-active-bg);
  border: 1px solid var(--btn-active-border);
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 30%);
  transform: translateX(-50%);
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}
</style>
