const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

console.log('Creating release.zip in dist/ ...');
const zip = new AdmZip();

// Include everything from src/
const srcPath = path.join(rootDir, 'src');
if (fs.existsSync(srcPath)) {
  const srcItems = fs.readdirSync(srcPath);
  for (const item of srcItems) {
    if (item === '.DS_Store') continue; // exclude macOS junk
    
    const itemPath = path.join(srcPath, item);
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      zip.addLocalFolder(itemPath, item);
    } else {
      zip.addLocalFile(itemPath);
    }
  }
} else {
  console.warn('WARNING: src/ folder not found!');
}

// Files and folders to include from root/
const toIncludeRoot = [
  'README.md',
  'LICENSE'
];

for (const item of toIncludeRoot) {
  const itemPath = path.join(rootDir, item);
  if (fs.existsSync(itemPath)) {
    const stats = fs.statSync(itemPath);
    if (stats.isDirectory()) {
      zip.addLocalFolder(itemPath, item);
    } else {
      zip.addLocalFile(itemPath);
    }
  } else {
    if (item === 'vendor') {
      console.warn('WARNING: vendor folder not found! Please run `npm run postinstall` first.');
    } else {
      console.warn(`WARNING: Could not find ${item} in root directory`);
    }
  }
}

const outputPath = path.join(distDir, 'release.zip');
zip.writeZip(outputPath);
console.log(`Successfully created ${outputPath}!`);
