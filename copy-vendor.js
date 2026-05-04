const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const vendorDir = path.join(rootDir, 'src', 'vendor');

// 1. Clean and recreate vendor directory
if (fs.existsSync(vendorDir)) {
  fs.rmSync(vendorDir, { recursive: true, force: true });
}
fs.mkdirSync(vendorDir);

// 2. Identify the dependencies we want to copy from node_modules
const filesToCopy = [
  // Prism JS and plugins
  { src: 'prismjs/prism.js', dest: 'prism.min.js' },
  { src: 'prismjs/components/prism-markup.min.js', dest: 'prism-markup.min.js' },
  { src: 'prismjs/components/prism-css.min.js', dest: 'prism-css.min.js' },
  { src: 'prismjs/components/prism-javascript.min.js', dest: 'prism-javascript.min.js' },
  { src: 'prismjs/plugins/line-numbers/prism-line-numbers.min.js', dest: 'prism-line-numbers.min.js' },
  { src: 'prismjs/plugins/line-numbers/prism-line-numbers.min.css', dest: 'prism-line-numbers.min.css' },
  // PrismThemes
  { src: 'prismjs/themes/prism.min.css', dest: 'prism.min.css' },
  { src: 'prismjs/themes/prism-tomorrow.min.css', dest: 'prism-tomorrow.min.css' },
  { src: 'prismjs/themes/prism-okaidia.min.css', dest: 'prism-okaidia.min.css' },
  { src: 'prismjs/themes/prism-coy.min.css', dest: 'prism-coy.min.css' },
  // Beautify
  { src: 'js-beautify/js/lib/beautify-html.js', dest: 'beautify-html.min.js' },
  // WebExtension Polyfill
  { src: 'webextension-polyfill/dist/browser-polyfill.min.js', dest: 'browser-polyfill.min.js' }
];

console.log('Copying vendor files from node_modules...');
for (const file of filesToCopy) {
  const srcPath = path.join(rootDir, 'node_modules', file.src);
  const destPath = path.join(vendorDir, file.dest);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`- Copied ${file.dest}`);
  } else {
    console.warn(`WARNING: Source file not found: ${srcPath}`);
  }
}
