import { describe, expect, it } from 'vitest';
import { extensionToFileType, getFileType, isHtmlDocument, isHtmlExtension } from '@/utils/fileType';

describe('fileType', () => {
  describe('isHtmlExtension', () => {
    it('returns true for .html and .htm', () => {
      expect(isHtmlExtension('/path/to/index.html')).toBe(true);
      expect(isHtmlExtension('/path/to/index.htm')).toBe(true);
      expect(isHtmlExtension('/path/to/INDEX.HTML')).toBe(true);
    });

    it('returns false for other extensions', () => {
      expect(isHtmlExtension('/path/to/index.js')).toBe(false);
      expect(isHtmlExtension('/path/to/style.css')).toBe(false);
    });
  });

  describe('isHtmlDocument', () => {
    it('returns true when pathname has html extension', () => {
      expect(isHtmlDocument('/sample.html', 'text/plain')).toBe(true);
    });

    it('returns true when contentType is text/html', () => {
      expect(isHtmlDocument('/app', 'text/html')).toBe(true);
    });

    it('returns false when neither matches', () => {
      expect(isHtmlDocument('/script.js', 'application/javascript')).toBe(false);
    });
  });

  describe('extensionToFileType', () => {
    it('maps extensions correctly', () => {
      expect(extensionToFileType(new URL('https://example.com/app.js'))).toBe('javascript');
      expect(extensionToFileType(new URL('https://example.com/style.css'))).toBe('css');
      expect(extensionToFileType(new URL('https://example.com/data.json'))).toBe('json');
      expect(extensionToFileType(new URL('https://example.com/feed.xml'))).toBe('xml');
      expect(extensionToFileType(new URL('https://example.com/image.png'))).toBeNull();
    });
  });

  describe('getFileType', () => {
    it('falls back to default html', () => {
      expect(getFileType(new URL('https://example.com/unknown'))).toBe('html');
    });
  });
});
