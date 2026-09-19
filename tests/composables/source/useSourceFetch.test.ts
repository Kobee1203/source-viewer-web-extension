import { mockBrowser } from '@@/tests/setup';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useSourceFetch } from '@/composables/source/useSourceFetch';
import { saveSnapshot } from '@/composables/useLocalFile';

describe('useSourceFetch', () => {
  const originalLocation = window.location.href;

  beforeEach(() => {
    sessionStorage.clear();
    history.replaceState(null, '', '/viewer.html');
  });

  afterEach(() => {
    sessionStorage.clear();
    history.replaceState(null, '', originalLocation);
  });

  it('loads and beautifies remote source code', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: true,
      text: 'function add(a,b){return a+b;}',
      contentType: 'application/javascript',
      contentDisposition: null,
      byteLength: 30,
      httpStatus: 200,
      httpStatusText: 'OK',
    });

    const { loading, code, rawCode, language, byteSize, httpStatus, load } = useSourceFetch();

    expect(loading.value).toBe(false);

    const loadPromise = load('https://example.com/add.js');
    expect(loading.value).toBe(true);

    await loadPromise;

    expect(loading.value).toBe(false);
    expect(rawCode.value).toBe('function add(a,b){return a+b;}');
    expect(code.value).toContain('function add(a, b) {');
    expect(language.value).toBe('javascript');
    expect(byteSize.value).toBe(30);
    expect(httpStatus.value).toBe(200);
  });

  it('handles remote fetch errors and flags native viewer fallback', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: false,
      error: 'Failed to fetch',
    });

    const { loading, errorMessage, errorWithNativeButton, load } = useSourceFetch();

    await load('https://example.com/fail.js');

    expect(loading.value).toBe(false);
    expect(errorMessage.value).not.toBeNull();
    expect(errorWithNativeButton.value).toBe(true);
  });

  it('restores stored snapshot when no URL parameter is provided', async () => {
    saveSnapshot('test.json', '{"name":"vitest"}', 'json');

    const { loading, code, fileName, isLocalSnapshot, language, load } = useSourceFetch();

    await load();

    expect(loading.value).toBe(false);
    expect(fileName.value).toBe('test.json');
    expect(isLocalSnapshot.value).toBe(true);
    expect(language.value).toBe('json');
    expect(code.value).toContain('{\n  "name": "vitest"\n}');
  });

  it('flags restricted URLs with native button fallback', async () => {
    const { loading, errorMessage, errorWithNativeButton, load } = useSourceFetch();

    await load('https://chromewebstore.google.com/detail/123');

    expect(loading.value).toBe(false);
    expect(errorMessage.value).not.toBeNull();
    expect(errorWithNativeButton.value).toBe(true);
  });

  it('loads from local File instance and formats source', async () => {
    const file = new File(['body{margin:0;}'], 'styles.css', { type: 'text/css' });
    const { loading, code, fileName, language, isLocalSnapshot, loadFromLocalFile } = useSourceFetch();

    await loadFromLocalFile(file);

    expect(loading.value).toBe(false);
    expect(fileName.value).toBe('styles.css');
    expect(language.value).toBe('css');
    expect(isLocalSnapshot.value).toBe(true);
    expect(code.value).toContain('body {\n  margin: 0;\n}');
  });
});
