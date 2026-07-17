# Changelog

All notable changes to this project will be documented in this file.

## [1.5.0] - not released

### Added

- **In-Place Auto-Open**: Navigating directly to a raw `.css`/`.js`/`.json`/`.xml` URL now renders the formatted viewer in place, as a Shadow DOM overlay on the page itself, instead of redirecting to the extension's viewer — the address bar keeps the original URL and the browser back button works as expected. (Firefox's built-in JSON viewer, when enabled via `devtools.jsonview.enabled`, still intercepts direct `.json` navigations before the extension can run.)

## [1.4.0] - 2026-07-17

### Added

- **Additional Languages**: Added Spanish, German, Italian, Japanese, Simplified Chinese, and Portuguese (Brazilian + European) on top of English and French — 9 locales total. The store description is now localized as well.
- **Native Source Viewer Action**: Added a toolbar button to open the current page in the browser's built-in `view-source:` viewer (left click opens in the same tab; middle click or Ctrl/Cmd+click opens in a new tab).

### Changed

- **Build & Codebase Migration**: Migrated the extension to WXT + TypeScript + Vue 3, with behaviour parity. Source is now organized into components, composables, and typed utilities.
- **Toolbar Redesign**: Reworked the toolbar into a coherent icon-button bar — word wrap became an icon toggle (highlighted when active), the theme selector gained a palette icon, and the native-viewer action is a dedicated icon button (using `@lucide/vue`).
- **Localization Overhaul**: Switched to YAML-based, type-safe messages via `@wxt-dev/i18n`; the `_locales/*/messages.json` files are now generated at build time.
- **Developer Tooling**: Added type-aware ESLint, Prettier (`printWidth` 120), and Stylelint; husky + lint-staged pre-commit hooks; a GitHub Actions CI workflow (lint + typecheck + build); and pinned Node 24 and pnpm via `engines`/`packageManager`.

### Fixed

- **Native Viewer Redirects**: The native-viewer action now survives redirects that strip the query string (e.g. sites that 301 `/?...` back to `/`). The request is routed through the background script, which tracks the intended tab by id instead of relying on a fragile query parameter, keeping the target URL clean.

## [1.3.0] - 2026-06-30

### Added

- **Language-aware Formatting**: Source files are now detected by extension (`.js`/`.mjs`, `.css`) and formatted with the matching beautifier (`beautify-js`, `beautify-css`), falling back to HTML formatting for other content.
- **Language-aware Syntax Highlighting**: The code block's PrismJS language class is set dynamically based on the detected file type (`javascript`, `css`, `markup`).
- **Clickable URLs**: `href` and `src` attribute values in HTML source are now clickable links that open the target in the viewer, resolving relative URLs and skipping hash fragments, `javascript:`, and `data:` URIs.
- **Page Size Status Bar**: A bottom status bar displays the page weight (formatted as B/KB/MB/GB), themed to match light and dark viewer backgrounds.

## [1.2.0] - 2026-05-13

### Added

- **Restricted Domain Handling**: The extension now detects sites where browsers prohibit extension activity (Chrome Web Store, Firefox Add-ons, account pages).
- **Native Fallback**: Added a button to open the browser's built-in "View Page Source" when the extension is blocked.
- **Manual Fallback**: Added a "Copy to clipboard" option if the browser blocks the extension from programmatically opening internal `view-source:` URLs.
- **Localization**: Added full support for French and English error messages and UI elements.

### Changed

- **Code Refactoring**: Centralized shared logic into `src/utils.js` to eliminate duplication between background and viewer scripts.
- **Firefox Compatibility**: Fixed background script loading issue on Firefox by including `utils.js` in the manifest's background scripts list.
- **Improved URL Extraction**: Enhanced URL parameter parsing to correctly handle anchors and fragments (hashes).

## [1.1.0] - 2026-05-02

### Added

- **Word Wrap**: Added a toggle to enable/disable line wrapping in the source view.
- **Theme Support**: Integrated multiple PrismJS themes (Default, Dark, Funky, etc.) with a persistent selector.
- **Syntax Highlighting**: Added support for HTML, CSS, and JavaScript formatting using `beautify-html`.
- **Cross-browser Compatibility**: Integrated `browser-polyfill.js` to ensure support for both Chrome and Firefox.

## [1.0.0] - 2026-04-19

### Added

- Initial release of the Source Code Viewer extension.
- Basic syntax highlighting using PrismJS.
- `view-source:` protocol interception.
