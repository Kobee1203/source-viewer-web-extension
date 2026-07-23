import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  srcDir: 'src',
  publicDir: 'src/public',
  // Force MV3 for all browsers (Firefox defaults to MV2). On Firefox MV3, WXT emits
  // background.scripts (an event page) since service workers aren't well supported there.
  manifestVersion: 3,
  modules: ['@wxt-dev/module-vue', '@wxt-dev/i18n/module'],
  // Explicit ES imports everywhere (no auto-imports) for readability / store reviewability.
  imports: false,
  manifest: ({ browser }) => ({
    // AMO (Firefox) caps the manifest name at 45 characters; Chrome allows ~75.
    name:
      browser === 'firefox'
        ? 'Source Code Viewer — HTML/CSS/JS/JSON/XML'
        : 'Source Code Viewer — HTML, CSS, JS, JSON & XML Formatter',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['activeTab', 'tabs', 'storage', 'scripting'],
    host_permissions: ['<all_urls>'],
    // Lets the in-place viewer (inplace-viewer.content.ts) embed viewer.html in a
    // full-viewport iframe on any origin's page for direct CSS/JS/JSON/XML navigations.
    // fontviewer.html is exposed too so a font link clicked from that embedded viewer
    // can open the dedicated font viewer from any origin.
    web_accessible_resources: [{ resources: ['viewer.html', 'fontviewer.html'], matches: ['<all_urls>'] }],
    action: {
      default_title: '__MSG_actionTitle__',
      default_icon: {
        16: 'icon/16.png',
        48: 'icon/48.png',
        128: 'icon/128.png',
      },
    },
    // Firefox add-on identity + data collection disclosure (was patched in build.js before).
    ...(browser === 'firefox' && {
      browser_specific_settings: {
        gecko: {
          id: 'source-viewer@kobee1203.github.io',
          data_collection_permissions: { required: ['none'] },
        },
      },
    }),
  }),
  // No minification: keep the built code readable (simplifies store submission review).
  vite: () => ({
    build: { minify: false },
  }),
});
