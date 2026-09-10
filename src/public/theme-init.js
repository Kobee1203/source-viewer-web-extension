try {
  var themeType = localStorage.getItem('viewer-theme-type') || 'light';
  document.documentElement.setAttribute('data-theme-type', themeType);
} catch (e) {}
