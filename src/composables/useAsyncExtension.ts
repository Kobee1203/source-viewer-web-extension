import { type Ref, type ShallowRef, onWatcherCleanup, ref, shallowRef, watch } from 'vue';
import type { Extension } from '@codemirror/state';

export interface AsyncExtension<T = Extension> {
  extension: ShallowRef<T>;
  loaded: Ref<boolean>;
}

/**
 * Lazily loads a CodeMirror {@link Extension} whenever `source` changes, keeping it in a ref.
 * Each `@codemirror/lang-*` and each theme is its own chunk, so both the language support and the
 * theme are fetched on demand — this composable factors out that shared load-with-stale-guard
 * pattern. The cleanup marks an in-flight load stale so a slower one can't clobber a newer value.
 */
export function useAsyncExtension<T>(source: () => T, loader: (value: T) => Promise<Extension>): AsyncExtension {
  const extension = shallowRef<Extension>([]);
  const loaded = ref(false);

  watch(
    source,
    async (value) => {
      let stale = false;
      onWatcherCleanup(() => (stale = true));
      const loadedExt = await loader(value);
      if (!stale) {
        extension.value = loadedExt;
        loaded.value = true;
      }
    },
    { immediate: true },
  );

  return { extension, loaded };
}
