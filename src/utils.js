// List of domains where extensions are restricted from fetching content or injecting scripts
const RESTRICTED_DOMAINS = [
  'chromewebstore.google.com',
  'addons.mozilla.org',
  'accounts.google.com',
  'chrome.google.com'
];

/**
 * Checks if the URL belongs to a restricted domain where extensions cannot fetch content.
 * 
 * @param {URL} url URL
 */
function isRestricted(url) {
  try {
    const hostname = url.hostname;
    // Check for restricted domains or non-http protocols (like chrome:// or about:)
    return RESTRICTED_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain)) ||
           !['http:', 'https:'].includes(url.protocol);
  } catch (e) {
    return false;
  }
}
