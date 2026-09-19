// List of domains where extensions are restricted from fetching content or injecting scripts.
const RESTRICTED_DOMAINS = [
  'chromewebstore.google.com',
  'addons.mozilla.org',
  'accounts.google.com',
  'chrome.google.com',
];

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'file:']);

/** Returns true if the URL points to a local file (file: scheme). */
export function isLocalFile(url: URL): boolean {
  return url.protocol === 'file:';
}

/**
 * Checks if the URL belongs to a restricted domain where extensions cannot fetch content,
 * or uses an internal/unsupported protocol (like chrome:// or about:).
 */
export function isRestricted(url: URL): boolean {
  try {
    if (!ALLOWED_PROTOCOLS.has(url.protocol)) return true;
    if (url.protocol === 'file:') return false;
    const hostname = url.hostname;
    return RESTRICTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
}
