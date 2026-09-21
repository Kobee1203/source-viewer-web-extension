import { browser } from 'wxt/browser';
import type { GetSessionSourceResponse, RefreshTabSourceResponse, SessionSourcePayload } from '@/utils/messaging';
import type { TabSourceCaptureResult } from '@/utils/tabSourceCapture';
import { captureTabSource } from '@/utils/tabSourceCapture';

export function getSessionSourceKey(viewerTabId: number): string {
  return `viewer:tab:${viewerTabId}`;
}

function isSessionSourcePayload(val: unknown): val is SessionSourcePayload {
  if (typeof val !== 'object' || val === null) return false;
  const candidate = val as Record<string, unknown>;
  return (
    typeof candidate.text === 'string' &&
    typeof candidate.byteSize === 'number' &&
    typeof candidate.isDomFallback === 'boolean' &&
    typeof candidate.timestamp === 'number'
  );
}

/**
 * Stores a captured source payload in browser.storage.session keyed by the viewer tab ID.
 */
export async function saveSessionSource(
  viewerTabId: number,
  captured: TabSourceCaptureResult,
  sourceTabId?: number,
): Promise<void> {
  const payload: SessionSourcePayload = {
    ...captured,
    sourceTabId,
    timestamp: Date.now(),
  };
  await browser.storage.session.set({
    [getSessionSourceKey(viewerTabId)]: payload,
  });
}

/**
 * Internal helper to retrieve the raw session source payload from browser.storage.session.
 */
async function getStoredSessionSource(viewerTabId?: number): Promise<SessionSourcePayload | null> {
  if (viewerTabId === undefined) return null;
  const key = getSessionSourceKey(viewerTabId);
  const data = await browser.storage.session.get(key);
  const payload = data[key];
  return isSessionSourcePayload(payload) ? payload : null;
}

/**
 * Retrieves the captured session source for a given viewer tab, checking whether
 * the originating source tab is still open.
 */
export async function getSessionSource(viewerTabId?: number): Promise<GetSessionSourceResponse> {
  if (viewerTabId === undefined) return { source: null };
  const source = await getStoredSessionSource(viewerTabId);
  if (!source) return { source: null };

  let sourceTabClosed = false;
  if (source.sourceTabId !== undefined) {
    try {
      const tab = await browser.tabs.get(source.sourceTabId);
      sourceTabClosed = !tab;
    } catch {
      sourceTabClosed = true;
    }
  }
  return { source, sourceTabClosed };
}

/**
 * Removes the captured session source for a closed viewer tab.
 */
export async function clearSessionSource(viewerTabId: number): Promise<void> {
  await browser.storage.session.remove(getSessionSourceKey(viewerTabId));
}

/**
 * Attempts to re-capture source from the original tab if it is still alive.
 * If the source tab has closed, returns `sourceTabClosed: true` and retains the existing snapshot.
 */
export async function refreshTabSource(viewerTabId?: number): Promise<RefreshTabSourceResponse> {
  if (viewerTabId === undefined) {
    return { ok: false, source: null, error: 'Unknown viewer tab' };
  }

  const existing = await getStoredSessionSource(viewerTabId);
  if (!existing) {
    return { ok: false, source: null, error: 'No session source recorded for tab' };
  }

  if (existing.sourceTabId === undefined) {
    return { ok: false, source: existing, sourceTabClosed: true };
  }

  let sourceTabExists = false;
  try {
    const tab = await browser.tabs.get(existing.sourceTabId);
    sourceTabExists = Boolean(tab);
  } catch {
    sourceTabExists = false;
  }

  if (!sourceTabExists) {
    return { ok: false, source: existing, sourceTabClosed: true };
  }

  const freshCaptured = await captureTabSource(existing.sourceTabId);
  if (!freshCaptured) {
    return { ok: false, source: existing, error: 'Failed to re-capture source tab' };
  }

  await saveSessionSource(viewerTabId, freshCaptured, existing.sourceTabId);
  const updated = await getStoredSessionSource(viewerTabId);
  return { ok: true, source: updated };
}
