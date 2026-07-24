import { onUnmounted, ref, type Ref } from 'vue';

/**
 * Copies text to the clipboard and exposes a transient marker of what was just copied, so a
 * caller can flash a "copied" affordance. `copied` holds the marker for `duration` ms, then
 * resets to null. The marker (generic `T`) lets the caller tell which item was copied — e.g.
 * a code point, so only that grid cell highlights.
 */
export function useCopyFeedback<T>(duration = 1000): {
  copied: Ref<T | null>;
  copy: (text: string, marker: T) => void;
} {
  const copied = ref<T | null>(null) as Ref<T | null>;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function copy(text: string, marker: T): void {
    void navigator.clipboard.writeText(text);
    copied.value = marker;
    clearTimeout(timer);
    timer = setTimeout(() => (copied.value = null), duration);
  }

  onUnmounted(() => clearTimeout(timer));

  return { copied, copy };
}
