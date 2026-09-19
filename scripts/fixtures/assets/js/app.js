import { trackEvent } from './analytics.js';

/**
 * Main application script.
 */
document.addEventListener('DOMContentLoaded', () => {
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.addEventListener('click', () => {
      trackEvent('navigation', 'click', 'logo');
    });
  }

  console.log('Source Viewer fixture application initialized.');
});
