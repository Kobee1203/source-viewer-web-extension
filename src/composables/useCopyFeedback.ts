import { type Ref, onUnmounted, shallowRef } from 'vue';

/**
 * Copies text to the clipboard and exposes a transient marker of what was just copied, so a
 * caller can flash a "copied" affordance. `copied` holds the marker for `duration` ms, then
 * resets to null. The marker (generic `T`) lets the caller tell which item was copied — e.g.
 * a code point, so only that grid cell highlights.
 */
export function useCopyFeedback<T>(duration = 1000): {
  copied: Ref<T | null>;
  copy: (text: string, marker: T) => Promise<boolean>;
} {
  const copied = shallowRef<T | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;

  async function copy(text: string, marker: T): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = marker;
      clearTimeout(timer);
      timer = setTimeout(() => (copied.value = null), duration);
      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
      return false;
    }
  }

  onUnmounted(() => clearTimeout(timer));

  return { copied, copy };
}
