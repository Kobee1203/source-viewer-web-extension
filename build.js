const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');
const pkg = require('./package.json');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

function createZip(targetBrowser) {
  const zipFileName = `${pkg.name}-${pkg.version}-${targetBrowser}.zip`;
  console.log(`Creating ${zipFileName} in dist/ ...`);
  const zip = new AdmZip();

  // Include everything from src/
  const srcPath = path.join(rootDir, 'src');
  if (fs.existsSync(srcPath)) {
    const srcItems = fs.readdirSync(srcPath);
    for (const item of srcItems) {
      if (item === '.DS_Store') continue; // exclude macOS junk
      
      const itemPath = path.join(srcPath, item);
      const stats = fs.statSync(itemPath);
      
      if (item === 'manifest.json') {
        const manifestObj = JSON.parse(fs.readFileSync(itemPath, 'utf8'));
        if (targetBrowser === 'firefox') {
          manifestObj.browser_specific_settings = {
            gecko: {
              id: "source-viewer@kobee1203.github.io",
              data_collection_permissions: {
                required: ["none"]
              }
            }
          };
          // Firefox MV3 support for service workers is sometimes disabled or problematic. 
          // It prefers background.scripts for Event Pages.
          if (manifestObj.background && manifestObj.background.service_worker) {
            manifestObj.background.scripts = [
              "vendor/browser-polyfill.min.js",
              manifestObj.background.service_worker
            ];
            delete manifestObj.background.service_worker;
          }
        }
        zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifestObj, null, 2), 'utf8'));
      } else if (stats.isDirectory()) {
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
      console.warn(`WARNING: Could not find ${item} in root directory`);
    }
  }

  const outputPath = path.join(distDir, zipFileName);
  zip.writeZip(outputPath);
  console.log(`Successfully created ${outputPath}!`);
}

createZip('chrome');
createZip('firefox');
