import type { App, Plugin } from 'vue';
import { createApp } from 'vue';

export function withSetup<T>(composable: () => T, ...plugins: Plugin[]): [T, App] {
  let result!: T;
  const app = createApp({
    setup() {
      result = composable();
      return () => {};
    },
  });

  if (plugins.length > 0) {
    plugins.forEach((plugin) => app.use(plugin));
  }

  app.mount(document.createElement('div'));

  return [result, app];
}
