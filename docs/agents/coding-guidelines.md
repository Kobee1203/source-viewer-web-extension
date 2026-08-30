# Coding Guidelines

This document outlines the strict coding rules and architecture conventions that must be followed in this project.

## 1. Strict Typing (TypeScript)

- **No `any` or forced casts (`as`)**: Variables must be correctly typed end-to-end to avoid silent runtime errors. Rely on strict types provided by libraries (e.g., `@xmldom/xmldom`) rather than generic DOM types when working in non-browser contexts.
- **No inline dynamic type imports**: Never use dynamic type imports like `import('@/utils/fileType').FileType` inline. Always declare types via a standard top-level `import type` statement at the top of the file.

## 2. Import Organization

- **Use Aliases**: Always prefer the `@/` alias (e.g., `@/components/`, `@/composables/`) over relative paths (`../`, `./`) when importing cross-directory modules.
- **Sorting and Grouping**: Imports are automatically grouped and sorted alphabetically via `@trivago/prettier-plugin-sort-imports`. Keep them organized: Frameworks -> External libraries -> Internal aliases (`@/`) -> Relative paths.
- **Type Imports Syntax**:
  - Utilize TypeScript's native concise syntax for mixed imports: `import { value, type MyType } from '...'`.
  - When importing **only** types from a module, strictly use the top-level keyword to avoid runtime side-effects: `import type { MyType } from '...'`.

## 3. CSS Architecture and Theming

- **Semantic and Dedicated Variables**: Never reuse a specific component's CSS variables for a generic component (e.g., do not use `--toolbar-border` in a generic modal). Define dedicated variables for generic components (e.g., `--dialog-border`).
- **Shared Styles**: Component styles shared across different entrypoints (`viewer` and `fontviewer`) must be isolated in `src/styles/*.css` (e.g., `dialog.css`, `toolbar.css`).
- **Dark / Light Mode Management**:
  - Default variables (Dark Theme) are declared in the base stylesheet (`style.css`).
  - Overrides for Light Theme (`[data-theme-type='light']`) must be declared directly in the `<style>` block of the main entry points (`App.vue`).

## 4. Internationalization (i18n)

- **Generic Keys for Generic Components**: Reusable components (like `Dialog.vue`) must have their own generic translation keys (e.g., `dialogClose`) and must not depend on context-specific keys from other features (like `searchClose`).
- **YAML Organization**: The insertion order in YAML files matters. Group keys by functional domain. For instance, search-related help keys should be placed immediately after the `searchResults` block.
- **Strict Typing**: When injecting dynamic keys from a computed property or variable into `t()`, use `I18nSimpleKey` (or a similarly strict type) instead of casting to `any` to preserve Vue-TSC safety.

## 5. Project Language

- **English Only**: Always use **English** for commit messages, GitHub issues, pull request descriptions, code comments, and documentation.

## 6. Post-Development Workflow

- **Verification Commands**: After completing any code changes, you must automatically execute the following commands to ensure the codebase remains clean and compiles successfully:
  - `pnpm run lint:fix` (Fix TS/JS/Vue lint errors)
  - `pnpm run lint:css:fix` (Fix CSS lint errors)
  - `pnpm run format` (Format codebase with Prettier)
  - `pnpm run compile` (Verify TypeScript compilation)
