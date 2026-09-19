/**
 * Simple local analytics mock for developer portal inspection.
 */
export function trackEvent(category, action, label) {
  const payload = {
    category,
    action,
    label,
    timestamp: new Date().toISOString(),
  };
  console.log('[Analytics Event]', payload);
}

export function initAnalytics() {
  window.addEventListener('DOMContentLoaded', () => {
    trackEvent('page', 'view', window.location.pathname);
  });
}

initAnalytics();
