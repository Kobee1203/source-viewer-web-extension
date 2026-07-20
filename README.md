# Source Code Viewer

A browser extension that replaces the browser's plain "View Source" with a readable, syntax-highlighted view — with multiple themes, word wrap, and clickable links. Built with [WXT](https://wxt.dev/) + TypeScript + Vue 3, and [CodeMirror 6](https://codemirror.net/) for rendering.

## Features

- **Syntax Highlighting**: Powered by CodeMirror 6, for HTML, CSS, JavaScript, JSON, and XML.
- **Code Formatting**: Automatic beautification of the source (via `js-beautify`).
- **In-Place Auto-Open**: Navigating directly to a raw `.css`/`.js`/`.json`/`.xml` URL renders the formatted viewer in place, keeping the original URL in the address bar.
- **Multiple Themes**: 45 CodeMirror themes (light & dark), loaded on demand, with a persistent selector.
- **Word Wrap, Line Numbers & Folding**: Toggle line wrapping; navigate with line numbers and code folding.
- **Clickable Links**: URLs in the source are clickable and routed by type — images open in the browser, other resources reopen in the viewer.
- **Native Viewer Toggle**: A toolbar button to open the browser's built-in `view-source:` viewer (same tab, or new tab with middle/Ctrl/Cmd-click).
- **Smart Fallback**: Detects restricted domains (like the Chrome Web Store) and falls back gracefully to the browser's native source viewer.
- **Localized**: Available in 9 languages (English, French, Spanish, German, Italian, Japanese, Simplified Chinese, and Brazilian/European Portuguese).
- **Cross-Platform**: Compatible with both Google Chrome and Mozilla Firefox (both Manifest V3).

## Installation

### Firefox

Visit the [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/source-code-viewer/) page.

### Chrome

Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/source-code-viewer/ninadapabgjafeobaoomggobomaogcdi) page.

## Development

Requires Node.js ≥ 24 and pnpm ≥ 11 (see `packageManager` in `package.json`).

```bash
pnpm install        # install dependencies
pnpm dev            # run in dev mode (Chrome); pnpm dev:firefox for Firefox
pnpm build          # build both chrome-mv3 and firefox-mv3 into .output/
pnpm zip            # produce the store zips (+ sources.zip)
```

Other useful scripts:

```bash
pnpm compile        # type-check (vue-tsc)
pnpm lint           # ESLint (type-aware)
pnpm lint:css       # Stylelint
pnpm format         # Prettier
```

## License

Distributed under the MIT License.
