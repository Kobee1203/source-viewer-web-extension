import { withSetup } from '@@/tests/helpers/withSetup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PREVIEW_FONT_FAMILY, formatFromUrl, useFontLoad } from '@/composables/useFontLoad';

class MockFontFace {
  family: string;
  source: string | ArrayBuffer;
  descriptors?: FontFaceDescriptors;
  status = 'loaded';

  constructor(family: string, source: string | ArrayBuffer, descriptors?: FontFaceDescriptors) {
    this.family = family;
    this.source = source;
    this.descriptors = descriptors;
  }

  load(): Promise<MockFontFace> {
    return Promise.resolve(this);
  }
}

describe('useFontLoad', () => {
  let addedFonts: Set<unknown>;
  let addMock: ReturnType<typeof vi.fn>;
  let deleteMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    addedFonts = new Set();
    addMock = vi.fn((face: unknown) => addedFonts.add(face));
    deleteMock = vi.fn((face: unknown) => addedFonts.delete(face));
    vi.stubGlobal('FontFace', MockFontFace);
    Object.defineProperty(document, 'fonts', {
      value: {
        add: addMock,
        delete: deleteMock,
        has: vi.fn((face: unknown) => addedFonts.has(face)),
      },
      writable: true,
      configurable: true,
    });
  });

  it('formatFromUrl extracts font extensions', () => {
    expect(formatFromUrl('https://example.com/font.woff2')).toBe('woff2');
    expect(formatFromUrl('file:///path/to/font.TTF')).toBe('ttf');
    expect(formatFromUrl(new URL('https://example.com/font.otf'))).toBe('otf');
    expect(formatFromUrl('no-ext')).toBe('');
  });

  it('loads font from ArrayBuffer', async () => {
    const [{ fontFamily, fileSize, format, loading, errorMessage, loadFromBuffer }] = withSetup(useFontLoad);

    const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    await loadFromBuffer(buffer, 'woff2');

    expect(loading.value).toBe(false);
    expect(errorMessage.value).toBeNull();
    expect(fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(fileSize.value).toBe(5);
    expect(format.value).toBe('woff2');
    expect(addMock).toHaveBeenCalled();
  });

  it('unload cleans up FontFace from document.fonts and resets state', async () => {
    const [fontLoad] = withSetup(useFontLoad);

    const buffer = new Uint8Array([10, 20]).buffer;
    await fontLoad.loadFromBuffer(buffer, 'ttf');

    expect(fontLoad.fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(addMock).toHaveBeenCalled();

    fontLoad.unload();

    expect(deleteMock).toHaveBeenCalled();
    expect(fontLoad.fontFamily.value).toBe('');
    expect(fontLoad.fileSize.value).toBeNull();
    expect(fontLoad.format.value).toBe('');
  });

  it('unloads FontFace automatically on unmount', async () => {
    const [fontLoad, app] = withSetup(useFontLoad);

    const buffer = new Uint8Array([10, 20]).buffer;
    await fontLoad.loadFromBuffer(buffer, 'ttf');

    expect(addMock).toHaveBeenCalled();

    app.unmount();

    expect(deleteMock).toHaveBeenCalled();
    expect(fontLoad.fontFamily.value).toBe('');
  });

  it('loads font from URL via fetch', async () => {
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      arrayBuffer: () => Promise.resolve(buffer),
    });
    vi.stubGlobal('fetch', fetchMock);

    const [fontLoad] = withSetup(useFontLoad);
    await fontLoad.loadFromUrl('https://example.com/inter.woff2');

    expect(fontLoad.loading.value).toBe(false);
    expect(fontLoad.fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(fontLoad.format.value).toBe('woff2');
    expect(fontLoad.fileSize.value).toBe(3);
    expect(fontLoad.targetUrl.value?.toString()).toBe('https://example.com/inter.woff2');
  });

  it('handles fetch failure gracefully', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
    vi.stubGlobal('fetch', fetchMock);

    const [fontLoad] = withSetup(useFontLoad);
    await fontLoad.loadFromUrl('https://example.com/missing.woff2');

    expect(fontLoad.loading.value).toBe(false);
    expect(fontLoad.fontFamily.value).toBe('');
    expect(fontLoad.errorMessage.value).toBeTruthy();
  });
});
