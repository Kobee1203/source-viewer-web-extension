import { afterEach, describe, expect, it } from 'vitest';
import { extractHostSource } from '@/utils/hostSource';
import { FAVICON_ATTR, HIDE_STYLE_ID, IFRAME_ID } from '@/utils/inplace';

describe('extractHostSource', () => {
  const originalLocation = window.location.href;
  const originalContentType = document.contentType;

  afterEach(() => {
    history.replaceState(null, '', originalLocation);
    Object.defineProperty(document, 'contentType', {
      value: originalContentType,
      configurable: true,
    });
    Reflect.deleteProperty(document, 'xmlVersion');
    Reflect.deleteProperty(document, 'xmlEncoding');
    document.documentElement.innerHTML = '<head></head><body></body>';
  });

  it('serializes XML document structure and strips extension-injected elements', () => {
    history.replaceState(null, '', '/sitemap.xml');
    Object.defineProperty(document, 'contentType', {
      value: 'application/xml',
      configurable: true,
    });
    Reflect.set(document, 'xmlVersion', '1.0');
    Reflect.set(document, 'xmlEncoding', 'UTF-8');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://kobee1203.github.io/</loc>
    <lastmod>2026-05-02</lastmod>
  </url>
</urlset>`,
      'application/xml',
    );

    // Simulate content.ts and inplace-viewer.content.ts injecting hide style, favicon, and iframe
    const hideStyle = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'style');
    hideStyle.id = HIDE_STYLE_ID;
    hideStyle.textContent = ':root { visibility: hidden !important; overflow: hidden !important; }';
    xmlDoc.documentElement.appendChild(hideStyle);

    const favicon = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'link');
    favicon.setAttribute(FAVICON_ATTR, 'true');
    xmlDoc.documentElement.appendChild(favicon);

    const iframe = xmlDoc.createElementNS('http://www.w3.org/1999/xhtml', 'div');
    iframe.id = IFRAME_ID;
    xmlDoc.documentElement.appendChild(iframe);

    const originalDocElement = document.documentElement;
    Object.defineProperty(document, 'documentElement', {
      value: xmlDoc.documentElement,
      configurable: true,
    });

    try {
      const source = extractHostSource();

      expect(source).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(source).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
      expect(source).toContain('<loc>https://kobee1203.github.io/</loc>');
      expect(source).not.toContain(HIDE_STYLE_ID);
      expect(source).not.toContain('visibility: hidden');
      expect(source).not.toContain(IFRAME_ID);
      expect(source).not.toContain(FAVICON_ATTR);
    } finally {
      Object.defineProperty(document, 'documentElement', {
        value: originalDocElement,
        configurable: true,
      });
    }
  });

  it('extracts XML from #webkit-xml-viewer-source-xml when present', () => {
    history.replaceState(null, '', '/feed.xml');
    Object.defineProperty(document, 'contentType', {
      value: 'text/xml',
      configurable: true,
    });

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(
      '<root><div id="webkit-xml-viewer-source-xml"><catalog><book id="1">XML</book></catalog></div></root>',
      'application/xml',
    );
    const originalDocElement = document.documentElement;
    Object.defineProperty(document, 'documentElement', {
      value: xmlDoc.documentElement,
      configurable: true,
    });

    try {
      const source = extractHostSource();

      expect(source).toContain('<catalog><book id="1">XML</book></catalog>');
      expect(source).not.toContain('webkit-xml-viewer-source-xml');
    } finally {
      Object.defineProperty(document, 'documentElement', {
        value: originalDocElement,
        configurable: true,
      });
    }
  });

  it('extracts raw text from <pre> for non-HTML/non-XML source files', () => {
    history.replaceState(null, '', '/script.js');
    Object.defineProperty(document, 'contentType', {
      value: 'application/javascript',
      configurable: true,
    });

    document.body.innerHTML = '<pre>const answer = 42;</pre>';

    expect(extractHostSource()).toBe('const answer = 42;');
  });

  it('serializes HTML document and strips extension-injected elements', () => {
    history.replaceState(null, '', '/index.html');
    Object.defineProperty(document, 'contentType', {
      value: 'text/html',
      configurable: true,
    });

    document.documentElement.innerHTML = `<head><style id="${HIDE_STYLE_ID}">:root{visibility:hidden}</style><link ${FAVICON_ATTR}="true"></head><body><h1>Hello</h1><div id="${IFRAME_ID}"></div></body>`;

    const source = extractHostSource();

    expect(source).toContain('<h1>Hello</h1>');
    expect(source).not.toContain(HIDE_STYLE_ID);
    expect(source).not.toContain(IFRAME_ID);
    expect(source).not.toContain(FAVICON_ATTR);
  });
});
