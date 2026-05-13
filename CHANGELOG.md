# Changelog

All notable changes to this project will be documented in this file.

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
