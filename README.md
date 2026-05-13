# Source Code Viewer

A browser extension to view formatted source code with syntax highlighting. It replaces the default browser's "View Source" with a more readable version featuring multiple themes and word-wrapping.

## Features

- **Syntax Highlighting**: Beautiful code highlighting for HTML, CSS, and JavaScript.
- **Code Formatting**: Automatic beautification of the source code.
- **Multiple Themes**: Choose from several PrismJS themes (Dark, Light, Funky, etc.).
- **Word Wrap**: Toggle line wrapping for long lines of code.
- **Smart Fallback**: Detects restricted domains (like the Chrome Web Store) and provides a graceful fallback to the browser's native source viewer.
- **Cross-Platform**: Compatible with both Google Chrome and Mozilla Firefox.

## Installation

### Firefox
Visit the [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/source-code-viewer/) page.

### Chrome
Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/source-code-viewer/ninadapabgjafeobaoomggobomaogcdi) page.

## Development

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Run `npm run build` to generate the extension packages in the `dist/` directory.

## License
Distributed under the MIT License.
