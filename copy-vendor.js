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
  // PrismThemes
  { src: 'prismjs/themes/prism.min.css', dest: 'prism.min.css' },
  { src: 'prismjs/themes/prism-tomorrow.min.css', dest: 'prism-tomorrow.min.css' },
  { src: 'prismjs/themes/prism-okaidia.min.css', dest: 'prism-okaidia.min.css' },
  { src: 'prismjs/themes/prism-coy.min.css', dest: 'prism-coy.min.css' },
  // Beautify
  { src: 'js-beautify/js/lib/beautify-html.js', dest: 'beautify-html.min.js' }
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
