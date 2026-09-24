import { describe, expect, it } from 'vitest';
import { resolveFetchStrategy } from '@/composables/source/resolver';
import { directLocalStrategy } from '@/composables/source/strategies/directLocalStrategy';
import { fileObjectStrategy } from '@/composables/source/strategies/fileObjectStrategy';
import { inplaceLocalStrategy } from '@/composables/source/strategies/inplaceLocalStrategy';
import { remoteFetchStrategy } from '@/composables/source/strategies/remoteFetchStrategy';
import { sessionSnapshotStrategy } from '@/composables/source/strategies/sessionSnapshotStrategy';
import { SourceFetchError } from '@/composables/source/types';

describe('resolveFetchStrategy', () => {
  it('resolves fileObjectStrategy for file target', () => {
    const file = new File(['hello'], 'test.js', { type: 'application/javascript' });
    const strategy = resolveFetchStrategy({ kind: 'file', file });
    expect(strategy).toBe(fileObjectStrategy);
  });

  it('resolves sessionSnapshotStrategy for snapshot target', () => {
    const strategy = resolveFetchStrategy({ kind: 'snapshot' });
    expect(strategy).toBe(sessionSnapshotStrategy);
  });

  it('resolves remoteFetchStrategy for remote http/https URLs', () => {
    const strategy = resolveFetchStrategy({
      kind: 'url',
      url: new URL('https://example.com/script.js'),
    });
    expect(strategy).toBe(remoteFetchStrategy);
  });

  it('throws restricted SourceFetchError for restricted URLs', () => {
    expect(() =>
      resolveFetchStrategy({
        kind: 'url',
        url: new URL('https://chromewebstore.google.com/detail/abc'),
      }),
    ).toThrowError(SourceFetchError);

    try {
      resolveFetchStrategy({
        kind: 'url',
        url: new URL('https://chromewebstore.google.com/detail/abc'),
      });
    } catch (err) {
      expect((err as SourceFetchError).kind).toBe('restricted');
      expect((err as SourceFetchError).allowNativeFallback).toBe(true);
    }
  });

  it('throws file-access-denied SourceFetchError when fileAccessDisallowed is set', () => {
    expect(() =>
      resolveFetchStrategy({
        kind: 'url',
        url: new URL('file:///path/to/script.js'),
        fileAccessDisallowed: true,
      }),
    ).toThrowError(SourceFetchError);

    try {
      resolveFetchStrategy({
        kind: 'url',
        url: new URL('file:///path/to/script.js'),
        fileAccessDisallowed: true,
      });
    } catch (err) {
      expect((err as SourceFetchError).kind).toBe('file-access-denied');
    }
  });

  it('resolves directLocalStrategy for file:// URLs in top-level window', () => {
    const strategy = resolveFetchStrategy({
      kind: 'url',
      url: new URL('file:///path/to/script.js'),
    });
    expect(strategy).toBe(directLocalStrategy);
  });

  it('resolves inplaceLocalStrategy for file:// URLs when embedded in iframe', () => {
    const originalTop = window.top;
    try {
      // Simulate iframe environment where window.self !== window.top
      Object.defineProperty(window, 'top', {
        value: {},
        configurable: true,
      });

      const strategy = resolveFetchStrategy({
        kind: 'url',
        url: new URL('file:///path/to/script.js'),
      });
      expect(strategy).toBe(inplaceLocalStrategy);
    } finally {
      Object.defineProperty(window, 'top', {
        value: originalTop,
        configurable: true,
      });
    }
  });

  it('resolves inplaceLocalStrategy for remote https:// URLs when embedded in iframe', () => {
    const originalTop = window.top;
    try {
      Object.defineProperty(window, 'top', {
        value: {},
        configurable: true,
      });

      const strategy = resolveFetchStrategy({
        kind: 'url',
        url: new URL('https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.js'),
      });
      expect(strategy).toBe(inplaceLocalStrategy);
    } finally {
      Object.defineProperty(window, 'top', {
        value: originalTop,
        configurable: true,
      });
    }
  });
});
