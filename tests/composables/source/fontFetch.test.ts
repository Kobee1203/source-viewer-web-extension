import { withSetup } from '@@/tests/helpers/withSetup';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useSourceFetch } from '@/composables/source/useSourceFetch';
import { PREVIEW_FONT_FAMILY } from '@/composables/useFontLoad';

class MockFontFace {
  family: string;
  source: string | ArrayBuffer;
  status = 'loaded';

  constructor(family: string, source: string | ArrayBuffer) {
    this.family = family;
    this.source = source;
  }

  load(): Promise<MockFontFace> {
    return Promise.resolve(this);
  }
}

describe('useSourceFetch - Font Handling', () => {
  let deleteMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    deleteMock = vi.fn();
    vi.stubGlobal('FontFace', MockFontFace);
    Object.defineProperty(document, 'fonts', {
      value: {
        add: vi.fn(),
        delete: deleteMock,
        has: vi.fn(),
      },
      writable: true,
      configurable: true,
    });
  });

  it('loads remote font URL into font mode', async () => {
    const fontBytes = new Uint8Array([1, 2, 3, 4]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: () => Promise.resolve(fontBytes.buffer),
      }),
    );

    const [sourceFetch] = withSetup(useSourceFetch);
    await sourceFetch.load('https://example.com/fonts/inter.woff2');

    expect(sourceFetch.loading.value).toBe(false);
    expect(sourceFetch.resourceType.value).toBe('font');
    expect(sourceFetch.fontFormat.value).toBe('woff2');
    expect(sourceFetch.fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(sourceFetch.byteSize.value).toBe(4);
    expect(sourceFetch.code.value).toBe('');
  });

  it('loads local font File instance into font mode', async () => {
    const fontData = new Uint8Array([10, 20, 30]);
    const file = new File([fontData], 'roboto.ttf', { type: 'font/ttf' });

    const [sourceFetch] = withSetup(useSourceFetch);
    await sourceFetch.loadFromLocalFile(file);

    expect(sourceFetch.loading.value).toBe(false);
    expect(sourceFetch.resourceType.value).toBe('font');
    expect(sourceFetch.fontFormat.value).toBe('ttf');
    expect(sourceFetch.fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(sourceFetch.fileName.value).toBe('roboto.ttf');
  });

  it('resets font state and unloads FontFace when navigating from font to code', async () => {
    const fontBytes = new Uint8Array([1, 2]);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url.endsWith('.woff2')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            arrayBuffer: () => Promise.resolve(fontBytes.buffer),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: 'OK',
          text: () => Promise.resolve('body { color: red; }'),
        });
      }),
    );

    const [sourceFetch] = withSetup(useSourceFetch);
    await sourceFetch.load('https://example.com/font.woff2');
    expect(sourceFetch.resourceType.value).toBe('font');

    const codeFile = new File(['const x = 42;'], 'app.js', { type: 'text/javascript' });
    await sourceFetch.loadFromLocalFile(codeFile);

    expect(sourceFetch.resourceType.value).toBe('code');
    expect(sourceFetch.code.value).toContain('const x = 42;');
    expect(sourceFetch.fontFamily.value).toBe('');
    expect(deleteMock).toHaveBeenCalled();
  });

  it('loads remote .eot font URL through pipeline into font mode', async () => {
    const fixturePath = resolve(__dirname, '../../fixtures/fa-regular-400.eot');
    const eotBuffer = readFileSync(fixturePath).buffer;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: () => Promise.resolve(eotBuffer),
      }),
    );

    const [sourceFetch] = withSetup(useSourceFetch);
    await sourceFetch.load('https://example.com/fa-regular-400.eot');

    expect(sourceFetch.loading.value).toBe(false);
    expect(sourceFetch.resourceType.value).toBe('font');
    expect(sourceFetch.fontFormat.value).toBe('eot');
    expect(sourceFetch.fontFamily.value).toBe(PREVIEW_FONT_FAMILY);
    expect(sourceFetch.byteSize.value).toBe(34390);
    expect(sourceFetch.code.value).toBe('');
  });
});
