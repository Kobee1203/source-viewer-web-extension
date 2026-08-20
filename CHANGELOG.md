# Changelog

All notable changes to this project will be documented in this file.

## [1.8.0] - 2006-08-20

### Added

- **Writing System Selector**: The font viewer's preview now offers a **writing system** dropdown listing only the scripts the loaded font actually covers (detected via the existing canvas coverage probe — no font parsing or extra network). Picking a script fills the preview with a native sample sentence for it. Covers Latin, Greek, Cyrillic, Armenian, Hebrew, Arabic, Devanagari, Thai, Ethiopic, Japanese, Chinese, and Korean. The dropdown is hidden when a single script is detected.
- **Download Button**: A toolbar button downloads the formatted source you're viewing. The filename follows the server's `Content-Disposition`, the URL's own filename, or a `download.<ext>` default. A downloaded **HTML** page gets a `<base>` pointing at the original URL so it still renders (styles, images, scripts) when opened locally, and a downloaded **CSS** file has its relative `url(...)`/`@import` references rewritten to absolute so it keeps finding its fonts and images. (Cross-origin webfonts that the server doesn't expose via CORS won't render from a local file — a fully self-contained download is planned for later.)
- **Search in Source**: `Cmd`/`Ctrl`+`F` (or the toolbar search button) now searches the whole source, not just the part rendered in the viewport. Matches are highlighted and scrolled into view as you type, with next/previous, match-case, whole-word, and regular-expression options. The search bar is localized in all languages.

### Changed

- **Locale-Aware Preview Text**: The initial preview text now follows the browser's UI language, derived from its ISO 15924 script (e.g. Japanese, Chinese, or Cyrillic instead of a Latin pangram). This replaces the previous per-locale sample string with a single source of truth shared with the writing-system selector, so the initial text and the "Latin" menu entry no longer diverge.
- **Direct Source Links**: Links to CSS/JS/JSON/XML files in the source now point at the real file URL (still shown in place by the extension when navigated to) instead of an encoded `viewer.html` link, so the address bar keeps a clean, copy-able URL. HTML links still open through the viewer to show their source.

### Fixed

- **Source Text Encoding**: Pages that declare their charset only in an HTML `<meta>` tag or via a malformed `Content-Type` header were decoded as UTF-8 and showed replacement characters (`�`) on accented or non-Latin text (e.g. `développeurs`). The source is now decoded using the charset from the HTTP header (parsed leniently), falling back to the `<meta>` declaration, then UTF-8. The page-weight status also reflects the true transferred size.

## [1.7.0] - 2026-07-24

### Added

- **Font Viewer**: Navigating directly to a font URL (`woff2`/`woff`/`ttf`/`otf`) now opens a dedicated font viewer with a live preview — editable sample text, adjustable size, bold/italic toggles, and a light/dark background switch — alongside font details (source, format, file size, HTTP status).
- **Glyph Grid**: A **Glyphs** view lists the characters the font actually renders. Hover a cell to see its `U+XXXX` code point, click to copy the character.
- **HTTP Status in Status Bar**: The status bar now surfaces the response's HTTP status.

### Changed

- **Theme-Aware Link Hover**: The link hover color now adapts to the theme type (light or dark).

### Fixed

- **Error Response Bodies**: The response body is now shown on an HTTP error status when the server returns one.
- **Authenticated Requests**: Credentials are now included in the fetch request, so pages behind a session cookie load correctly.
- **Empty Glyph Grid on Firefox**: The glyph-coverage probe canvas is now attached to the document — Firefox only exposes a `FontFace`-loaded font to a canvas connected to the DOM, so the grid no longer renders empty.
- **Firefox Store Name**: Shortened the Firefox extension name to comply with AMO's 45-character limit.

## [1.6.1] - 2026-07-22

### Changed

- **Store Listing**: Renamed the extension to "Source Code Viewer — HTML, CSS, JS, JSON & XML Formatter" and reworded the store summary across all locales to mention the supported languages (HTML, CSS, JavaScript, JSON, XML) and formatting, improving discoverability. No functional changes.

## [1.6.0] - 2026-07-20

### Changed

- **Syntax Highlighting Engine**: Migrated the viewer from PrismJS to **CodeMirror 6** for rendering and highlighting (read-only). Source is still formatted with `js-beautify`; CodeMirror now handles display, line numbers, word wrap, and code folding.
- **Themes**: Replaced the 8 bundled Prism themes with the full CodeMirror theme set (`@uiw/codemirror-theme-*`) — **45 themes** — with `default` mapped to _Basic Light_.\
  ⚠️ **Theme ids changed, so a previously selected theme resets to the default and must be re-picked once.**
- **On-Demand Loading**: Themes and language grammars are now code-split and loaded on demand — only the selected theme and the current file's language are fetched (from the packaged extension, no network) and parsed — keeping them out of the initial viewer bundle.

## [1.5.0] - 2026-07-18

### Added

- **In-Place Auto-Open**: Navigating directly to a raw `.css`/`.js`/`.json`/`.xml` URL now renders the formatted viewer in place — as a full-viewport iframe embedding the viewer page over the original page — instead of redirecting the tab. The address bar keeps the original URL and the browser back button works in a single hop. (Firefox's built-in JSON viewer, when enabled via `devtools.jsonview.enabled`, still intercepts direct `.json` navigations before the extension can run.)
- **JSON Support**: Added JSON syntax highlighting and formatting (with a safe fallback for invalid JSON), plus content-type-aware file detection — the response's real MIME type now takes precedence over the URL extension (handles extensionless URLs such as `fonts.googleapis.com/css2?…`).
- **Type-Aware Link Routing**: Links in the viewer are now routed by the target's type — image URLs (`.png`, `.svg`, …) open in the browser to render natively, while source files reopen in the code viewer. Clickable URLs now also cover CSS `url(…)` values and the HTML `content` attribute (e.g. `og:image`), the latter only when it holds an absolute URL.

### Fixed

- **Theme Stylesheet URL**: Theme stylesheets are now resolved via `browser.runtime.getURL`, so they load correctly regardless of the page hosting the viewer.
- **Line-Number Alignment**: Line numbers no longer misalign when word wrap is on. The viewer now waits for fonts (`document.fonts.ready`) and a frame (`requestAnimationFrame`) before highlighting, and recomputes line-number row heights whenever word wrap is toggled.

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
