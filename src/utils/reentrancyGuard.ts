export interface ReentrancyGuardOptions {
  cooldownMs?: number;
}

export interface ReentrancyGuard<K = string | number> {
  run: (key: K, task: () => Promise<void>) => Promise<boolean>;
  isLocked: (key: K) => boolean;
  reset: () => void;
}

/**
 * Creates a reentrancy and cooldown guard for actions keyed by an identifier (e.g. tabId or URL).
 *
 * Guarantees:
 * 1. An action for key K cannot run if an execution for key K is already in-flight.
 * 2. An action for key K cannot run again within `cooldownMs` of its previous trigger.
 * 3. Returns a boolean indicating whether the task was executed (true) or dropped (false).
 */
export function createReentrancyGuard<K = string | number>(options: ReentrancyGuardOptions = {}): ReentrancyGuard<K> {
  const cooldownMs = options.cooldownMs ?? 400;
  const inFlight = new Set<K>();
  const lastTriggered = new Map<K, number>();

  function cleanStale(now: number): void {
    for (const [key, timestamp] of lastTriggered.entries()) {
      if (now - timestamp >= cooldownMs && !inFlight.has(key)) {
        lastTriggered.delete(key);
      }
    }
  }

  function isLocked(key: K): boolean {
    const now = Date.now();
    cleanStale(now);
    if (inFlight.has(key)) return true;
    const last = lastTriggered.get(key);
    return last !== undefined && now - last < cooldownMs;
  }

  async function run(key: K, task: () => Promise<void>): Promise<boolean> {
    if (isLocked(key)) {
      return false;
    }

    inFlight.add(key);
    lastTriggered.set(key, Date.now());

    try {
      await task();
      return true;
    } finally {
      inFlight.delete(key);
    }
  }

  function reset(): void {
    inFlight.clear();
    lastTriggered.clear();
  }

  return {
    run,
    isLocked,
    reset,
  };
}

/**
 * Derives a discriminator key for source viewer opening actions.
 */
export function getViewerActionKey(tabId?: number, rawUrl?: string, isLink = false): string {
  if (isLink && rawUrl) return `link:${rawUrl}`;
  if (tabId !== undefined) return `tab:${tabId}`;
  if (rawUrl) return `url:${rawUrl}`;
  return 'global';
}
