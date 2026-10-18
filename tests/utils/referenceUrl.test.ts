import { describe, expect, it } from 'vitest';
import { extractReferenceMatches, isAbsoluteUrl, parseReferenceUrl } from '@/utils/referenceUrl';

describe('referenceUrl utils', () => {
  const baseUrl = 'https://example.com/sub/index.html';

  describe('isAbsoluteUrl', () => {
    it('returns true for http, https and protocol-relative URLs', () => {
      expect(isAbsoluteUrl('https://example.com/asset.js')).toBe(true);
      expect(isAbsoluteUrl('http://example.com/asset.js')).toBe(true);
      expect(isAbsoluteUrl('//cdn.example.com/lib.js')).toBe(true);
      expect(isAbsoluteUrl('  HTTPS://EXAMPLE.COM/ASSET.JS  ')).toBe(true);
    });

    it('returns false for relative URLs and non-http schemes', () => {
      expect(isAbsoluteUrl('./assets/app.js')).toBe(false);
      expect(isAbsoluteUrl('../styles.css')).toBe(false);
      expect(isAbsoluteUrl('/root.js')).toBe(false);
      expect(isAbsoluteUrl('javascript:void(0)')).toBe(false);
    });
  });

  describe('extractReferenceMatches', () => {
    it('extracts href, src, content attributes and css url() functions', () => {
      const source = `
        <link rel="stylesheet" href="./style.css">
        <script src="/main.js"></script>
        <meta property="og:image" content="https://example.com/og.png">
        <style>
          .bg { background-image: url('assets/bg.jpg'); }
        </style>
      `;

      const matches = Array.from(extractReferenceMatches(source));
      expect(matches).toHaveLength(4);

      expect(matches[0]).toMatchObject({
        attr: 'href',
        rawUrl: './style.css',
      });
      expect(matches[1]).toMatchObject({
        attr: 'src',
        rawUrl: '/main.js',
      });
      expect(matches[2]).toMatchObject({
        attr: 'content',
        rawUrl: 'https://example.com/og.png',
      });
      expect(matches[3]).toMatchObject({
        attr: undefined,
        rawUrl: 'assets/bg.jpg',
      });
    });
  });

  describe('parseReferenceUrl', () => {
    it('resolves valid relative and absolute URLs', () => {
      const rel = parseReferenceUrl('href', './styles.css', baseUrl);
      expect(rel?.toString()).toBe('https://example.com/sub/styles.css');

      const abs = parseReferenceUrl('src', 'https://cdn.example.com/lib.js', baseUrl);
      expect(abs?.toString()).toBe('https://cdn.example.com/lib.js');
    });

    it('rejects empty or whitespace-only URLs', () => {
      expect(parseReferenceUrl('href', '', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', '   ', baseUrl)).toBeNull();
    });

    it('rejects in-page hash anchors', () => {
      expect(parseReferenceUrl('href', '#', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', '#header', baseUrl)).toBeNull();
    });

    it('rejects dangerous and pseudo execution schemes (case-insensitive)', () => {
      expect(parseReferenceUrl('href', 'javascript:alert(1)', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', 'JAVASCRIPT:alert(1)', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', '   JavaScript:alert(1)', baseUrl)).toBeNull();

      expect(parseReferenceUrl('href', 'data:text/html,<h1>test</h1>', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', 'DATA:text/html,<h1>test</h1>', baseUrl)).toBeNull();

      expect(parseReferenceUrl('href', 'vbscript:msgbox(1)', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', 'VBScript:msgbox(1)', baseUrl)).toBeNull();
      expect(parseReferenceUrl('href', '  VBSCRIPT:msgbox(1)  ', baseUrl)).toBeNull();
    });

    it('requires content= attributes to be absolute URLs', () => {
      expect(parseReferenceUrl('content', './relative.png', baseUrl)).toBeNull();
      expect(parseReferenceUrl('content', '/root-relative.png', baseUrl)).toBeNull();
      expect(parseReferenceUrl('content', 'https://example.com/meta.png', baseUrl)?.toString()).toBe(
        'https://example.com/meta.png',
      );
    });

    it('returns null on invalid / unparseable URLs', () => {
      expect(parseReferenceUrl('href', 'http://::invalid::', baseUrl)).toBeNull();
    });
  });
});
