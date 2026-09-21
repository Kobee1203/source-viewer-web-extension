import { mockBrowser } from '@@/tests/setup';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearSessionSource,
  getSessionSource,
  getSessionSourceKey,
  refreshTabSource,
  saveSessionSource,
} from '@/utils/sessionSource';
import * as tabSourceCapture from '@/utils/tabSourceCapture';

describe('sessionSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSessionSourceKey', () => {
    it('generates the expected key for a viewer tab ID', () => {
      expect(getSessionSourceKey(123)).toBe('viewer:tab:123');
    });
  });

  describe('saveSessionSource and getSessionSource', () => {
    it('stores and retrieves session payload correctly', async () => {
      const mockStorage: Record<string, unknown> = {};
      mockBrowser.storage.session.set.mockImplementation((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      });
      mockBrowser.storage.session.get.mockImplementation((key: string) =>
        Promise.resolve({
          [key]: mockStorage[key],
        }),
      );

      const captured = {
        text: '<h1>Test</h1>',
        byteSize: 13,
        isDomFallback: false,
        contentType: 'text/html',
      };

      await saveSessionSource(10, captured, 5);

      const res = await getSessionSource(10);
      expect(res.source).not.toBeNull();
      expect(res.source?.text).toBe('<h1>Test</h1>');
      expect(res.source?.sourceTabId).toBe(5);
      expect(res.source?.isDomFallback).toBe(false);
      expect(res.source?.timestamp).toBeTypeOf('number');
      expect(res.sourceTabClosed).toBe(false);
    });

    it('returns source: null if tab ID is undefined or not in storage', async () => {
      mockBrowser.storage.session.get.mockResolvedValue({});
      expect((await getSessionSource(undefined)).source).toBeNull();
      expect((await getSessionSource(99)).source).toBeNull();
    });

    it('returns source: null if storage contains invalid data structure', async () => {
      mockBrowser.storage.session.get.mockResolvedValue({
        'viewer:tab:99': { invalid: true },
      });
      expect((await getSessionSource(99)).source).toBeNull();
    });

    it('flags sourceTabClosed: true when source tab does not exist', async () => {
      const payload = {
        text: 'hello',
        byteSize: 5,
        isDomFallback: false,
        sourceTabId: 12,
        timestamp: 12345,
      };
      mockBrowser.storage.session.get.mockResolvedValue({ 'viewer:tab:10': payload });
      mockBrowser.tabs.get.mockRejectedValue(new Error('Tab closed'));

      const res = await getSessionSource(10);
      expect(res.source?.text).toBe('hello');
      expect(res.sourceTabClosed).toBe(true);
    });
  });

  describe('clearSessionSource', () => {
    it('removes the session key for the viewer tab', async () => {
      await clearSessionSource(42);
      expect(mockBrowser.storage.session.remove).toHaveBeenCalledWith('viewer:tab:42');
    });
  });

  describe('refreshTabSource', () => {
    it('returns error when viewerTabId is undefined', async () => {
      const res = await refreshTabSource(undefined);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Unknown viewer tab');
    });

    it('returns error when no session source is recorded', async () => {
      mockBrowser.storage.session.get.mockResolvedValue({});
      const res = await refreshTabSource(10);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('No session source recorded for tab');
    });

    it('returns sourceTabClosed: true when sourceTabId is undefined', async () => {
      const existing = {
        text: 'test',
        byteSize: 4,
        isDomFallback: false,
        timestamp: 12345,
      };
      mockBrowser.storage.session.get.mockResolvedValue({ 'viewer:tab:10': existing });

      const res = await refreshTabSource(10);
      expect(res.ok).toBe(false);
      expect(res.sourceTabClosed).toBe(true);
      expect(res.source).toEqual(existing);
    });

    it('returns sourceTabClosed: true when source tab does not exist in browser', async () => {
      const existing = {
        text: 'test',
        byteSize: 4,
        isDomFallback: false,
        sourceTabId: 999,
        timestamp: 12345,
      };
      mockBrowser.storage.session.get.mockResolvedValue({ 'viewer:tab:10': existing });
      mockBrowser.tabs.get.mockRejectedValue(new Error('Tab not found'));

      const res = await refreshTabSource(10);
      expect(res.ok).toBe(false);
      expect(res.sourceTabClosed).toBe(true);
      expect(res.source).toEqual(existing);
    });

    it('returns error and keeps existing source when tab exists but re-capture fails', async () => {
      const existing = {
        text: 'test',
        byteSize: 4,
        isDomFallback: false,
        sourceTabId: 5,
        timestamp: 12345,
      };
      mockBrowser.storage.session.get.mockResolvedValue({ 'viewer:tab:10': existing });
      mockBrowser.tabs.get.mockResolvedValue({ id: 5 });
      vi.spyOn(tabSourceCapture, 'captureTabSource').mockResolvedValue(null);

      const res = await refreshTabSource(10);
      expect(res.ok).toBe(false);
      expect(res.error).toBe('Failed to re-capture source tab');
      expect(res.source).toEqual(existing);
    });

    it('re-captures source and updates storage when source tab is alive', async () => {
      const existing = {
        text: 'old',
        byteSize: 3,
        isDomFallback: false,
        sourceTabId: 5,
        timestamp: 1000,
      };
      const mockStorage: Record<string, unknown> = { 'viewer:tab:10': existing };
      mockBrowser.storage.session.set.mockImplementation((items: Record<string, unknown>) => {
        Object.assign(mockStorage, items);
        return Promise.resolve();
      });
      mockBrowser.storage.session.get.mockImplementation((key: string) =>
        Promise.resolve({
          [key]: mockStorage[key],
        }),
      );
      mockBrowser.tabs.get.mockResolvedValue({ id: 5 });

      const freshCapture = {
        text: 'fresh content',
        byteSize: 13,
        isDomFallback: false,
        contentType: 'text/html',
      };
      vi.spyOn(tabSourceCapture, 'captureTabSource').mockResolvedValue(freshCapture);

      const res = await refreshTabSource(10);
      expect(res.ok).toBe(true);
      expect(res.source?.text).toBe('fresh content');
      expect(res.source?.sourceTabId).toBe(5);
    });
  });
});
