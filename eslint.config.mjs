import pluginVue from 'eslint-plugin-vue';
import { withVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

export default withVueTs(
  // Project options for the Vue + TypeScript resolution (type-aware linting).
  { rootDir: import.meta.dirname },

  // Only lint our own source; everything generated or vendored is skipped.
  {
    name: 'app/ignores',
    ignores: [
      '.output/**',
      '.wxt/**',
      'node_modules/**',
      'src/public/**', // vendored themes + static assets
    ],
  },

  { name: 'app/files', files: ['**/*.{ts,mts,vue}'] },

  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommendedTypeChecked,

  {
    name: 'app/rules',
    rules: {
      // Our single-name view components (Toolbar, etc.) are app-local, not a
      // published component library where clashes with HTML elements matter.
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    // The background message listener returns a Promise to reply asynchronously
    // (the standard WebExtensions pattern), which is a legitimate promise in a
    // callback slot the rule would otherwise flag.
    name: 'app/background',
    files: ['src/entrypoints/background.ts'],
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { arguments: false } },
      ],
    },
  },

  // Must stay last: turns off rules that conflict with Prettier's formatting.
  eslintConfigPrettier,
);
