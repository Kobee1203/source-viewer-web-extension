import { shallowRef, watch, onWatcherCleanup, type ShallowRef } from 'vue';
import type { Extension } from '@codemirror/state';

/**
 * Lazily loads a CodeMirror {@link Extension} whenever `source` changes, keeping it in a ref.
 * Each `@codemirror/lang-*` and each theme is its own chunk, so both the language support and the
 * theme are fetched on demand — this composable factors out that shared load-with-stale-guard
 * pattern. The cleanup marks an in-flight load stale so a slower one can't clobber a newer value.
 */
export function useAsyncExtension<T>(source: () => T, loader: (value: T) => Promise<Extension>): ShallowRef<Extension> {
  const extension = shallowRef<Extension>([]);
  watch(
    source,
    async (value) => {
      let stale = false;
      onWatcherCleanup(() => (stale = true));
      const loaded = await loader(value);
      if (!stale) extension.value = loaded;
    },
    { immediate: true },
  );
  return extension;
}
