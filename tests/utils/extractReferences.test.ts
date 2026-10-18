import { describe, expect, it } from 'vitest';
import { extractReferences } from '@/utils/extractReferences';

describe('extractReferences', () => {
  const baseUrl = 'https://example.com/project/index.html';

  it('returns empty array when source or baseUrl is empty', () => {
    expect(extractReferences('', baseUrl)).toEqual([]);
    expect(extractReferences('<html></html>', '')).toEqual([]);
  });

  it('extracts source and font references while excluding images', () => {
    const html = `
      <link rel="stylesheet" href="./css/main.css">
      <link rel="stylesheet" href="./css/main.css">
      <script src="/js/bundle.js"></script>
      <img src="./images/banner.png" alt="banner">
      <link rel="preload" href="https://fonts.example.com/inter.woff2" as="font">
    `;

    const references = extractReferences(html, baseUrl);

    // Images must be excluded
    expect(references.some((ref) => ref.url.endsWith('banner.png'))).toBe(false);

    // CSS file (counted twice)
    const cssRef = references.find((ref) => ref.url === 'https://example.com/project/css/main.css');
    expect(cssRef).toBeDefined();
    expect(cssRef?.filename).toBe('main.css');
    expect(cssRef?.linkTarget).toBe('source');
    expect(cssRef?.fileType).toBe('css');
    expect(cssRef?.count).toBe(2);

    // JS file (counted once)
    const jsRef = references.find((ref) => ref.url === 'https://example.com/js/bundle.js');
    expect(jsRef).toBeDefined();
    expect(jsRef?.filename).toBe('bundle.js');
    expect(jsRef?.linkTarget).toBe('source');
    expect(jsRef?.fileType).toBe('javascript');
    expect(jsRef?.count).toBe(1);

    // Font file (counted once)
    const fontRef = references.find((ref) => ref.url === 'https://fonts.example.com/inter.woff2');
    expect(fontRef).toBeDefined();
    expect(fontRef?.filename).toBe('inter.woff2');
    expect(fontRef?.linkTarget).toBe('font');
    expect(fontRef?.fileType).toBeNull();
    expect(fontRef?.count).toBe(1);
  });

  it('ignores anchors, javascript:, data:, and vbscript: URLs', () => {
    const html = `
      <a href="#section">Anchor</a>
      <a href="javascript:void(0)">JS</a>
      <a href="JAVASCRIPT:alert(1)">JS Caps</a>
      <a href="vbscript:msgbox(1)">VBS</a>
      <a href="VBScript:msgbox(1)">VBS Caps</a>
      <img src="data:image/png;base64,abc">
      <script src="./valid.js"></script>
    `;

    const references = extractReferences(html, baseUrl);
    expect(references).toHaveLength(1);
    expect(references[0]?.url).toBe('https://example.com/project/valid.js');
  });
});
