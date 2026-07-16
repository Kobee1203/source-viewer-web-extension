// List of domains where extensions are restricted from fetching content or injecting scripts.
const RESTRICTED_DOMAINS = [
  'chromewebstore.google.com',
  'addons.mozilla.org',
  'accounts.google.com',
  'chrome.google.com',
];

/**
 * Checks if the URL belongs to a restricted domain where extensions cannot fetch content,
 * or uses a non-http(s) protocol (like chrome:// or about:).
 */
export function isRestricted(url: URL): boolean {
  try {
    const hostname = url.hostname;
    return (
      RESTRICTED_DOMAINS.some((domain) => hostname === domain || hostname.endsWith('.' + domain)) ||
      !['http:', 'https:'].includes(url.protocol)
    );
  } catch {
    return false;
  }
}
