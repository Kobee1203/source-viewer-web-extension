import { describe, expect, it } from 'vitest';
import { resolveUrl } from '@/utils/cm-linkify';
import { fontViewerUrl } from '@/utils/fontViewerUrl';
import { viewerUrl } from '@/utils/viewerUrl';

describe('cm-linkify resolveUrl', () => {
  const baseUrl = 'file:///Users/john/site/index.html';

  it('routes relative local CSS/JS files to their native file:/// URL for in-place handling', () => {
    const cssUrl = resolveUrl('href', './assets/css/main.css', baseUrl);
    expect(cssUrl).toBe('file:///Users/john/site/assets/css/main.css');

    const jsUrl = resolveUrl('src', './assets/js/app.js', baseUrl);
    expect(jsUrl).toBe('file:///Users/john/site/assets/js/app.js');
  });

  it('routes local HTML files through viewerUrl', () => {
    const htmlUrl = resolveUrl('href', './docs/guide.html', baseUrl);
    expect(htmlUrl).toBe(viewerUrl('file:///Users/john/site/docs/guide.html'));
  });

  it('routes local fonts to fontViewerUrl', () => {
    const fontUrl = resolveUrl('href', './fonts/inter.woff2', baseUrl);
    expect(fontUrl).toBe(fontViewerUrl('file:///Users/john/site/fonts/inter.woff2'));
  });

  it('routes local images to their native file:/// URL', () => {
    const imgUrl = resolveUrl('src', './images/logo.png', baseUrl);
    expect(imgUrl).toBe('file:///Users/john/site/images/logo.png');
  });

  it('routes remote source files directly for in-place handling', () => {
    const remoteJs = resolveUrl('src', 'https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js', baseUrl);
    expect(remoteJs).toBe('https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js');
  });

  it('routes remote fonts to fontViewerUrl', () => {
    const remoteFont = resolveUrl('href', 'https://example.com/fonts/inter.woff2', baseUrl);
    expect(remoteFont).toBe(fontViewerUrl('https://example.com/fonts/inter.woff2'));
  });

  it('ignores invalid or anchor URLs', () => {
    expect(resolveUrl('href', '#section', baseUrl)).toBeNull();
    expect(resolveUrl('href', 'javascript:alert(1)', baseUrl)).toBeNull();
    expect(resolveUrl('href', 'data:text/html,test', baseUrl)).toBeNull();
  });
});
