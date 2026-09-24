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

  it('refreshSource re-captures fresh source from active source tab', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: true,
      source: {
        text: '<h1>Refreshed</h1>',
        byteSize: 18,
        isDomFallback: false,
        timestamp: 99999,
      },
    });

    const { code, rawCode, isDomFallback, isSourceTabClosed, refreshSource } = useSourceFetch();

    await refreshSource();

    expect(rawCode.value).toBe('<h1>Refreshed</h1>');
    expect(code.value).toContain('<h1>Refreshed</h1>');
    expect(isDomFallback.value).toBe(false);
    expect(isSourceTabClosed.value).toBe(false);
  });

  it('refreshSource flags isSourceTabClosed when source tab is closed', async () => {
    mockBrowser.runtime.sendMessage.mockResolvedValueOnce({
      ok: false,
      sourceTabClosed: true,
      source: {
        text: '<h1>Existing Snapshot</h1>',
        byteSize: 26,
        isDomFallback: false,
        timestamp: 12345,
      },
    });

    const { isSourceTabClosed, refreshSource } = useSourceFetch();

    await refreshSource();

    expect(isSourceTabClosed.value).toBe(true);
  });

  it('clears URL query parameters and loads file from active directory without fetch', async () => {
    history.replaceState(null, '', '/viewer.html?url=file%3A%2F%2F%2Ffixtures%2Fsample.html');
    const { useLocalDirectory } = await import('@/composables/useLocalDirectory');
    const dir = useLocalDirectory();
    await dir.initDirectory('fixtures', [
      { path: 'sample.html', name: 'sample.html', type: 'html', size: 50, text: '<h1>Directory File</h1>' },
    ]);

    const { loading, code, isDirectoryFile, load } = useSourceFetch();

    await load('file:///fixtures/sample.html');

    expect(loading.value).toBe(false);
    expect(isDirectoryFile.value).toBe(true);
    expect(code.value).toContain('<h1>Directory File</h1>');
    expect(window.location.search).toBe('');

    await dir.closeDirectory();
  });
});
