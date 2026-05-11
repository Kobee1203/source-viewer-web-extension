if (typeof importScripts !== 'undefined') {
  importScripts('vendor/browser-polyfill.min.js');
  importScripts('utils.js');
}

browser.action.onClicked.addListener((tab) => {
  let url = tab.url;
  
  if (url.startsWith("view-source:")) {
    url = url.replace(/^view-source:/, "");
  }

  if (url.startsWith("http")) {
    // If it's a restricted domain, we open the native view-source instead of our viewer
    if (isRestricted(url)) {
      browser.tabs.create({ url: "view-source:" + url });
      return;
    }
    const viewerUrl = browser.runtime.getURL("viewer.html") + "?url=" + encodeURIComponent(url);
    browser.tabs.create({ url: viewerUrl });
  }
});

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  const url = tab.url || changeInfo.url || '';
  if (!url.startsWith('view-source:')) return;

  const targetUrl = url.slice('view-source:'.length);
  
  // If the target URL is restricted, we let the browser handle it natively
  if (isRestricted(targetUrl)) return;

  const viewerUrl = browser.runtime.getURL('viewer.html')
    + '?url=' + encodeURIComponent(targetUrl);

  browser.tabs.update(tabId, { url: viewerUrl });
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type !== 'FETCH_SOURCE') return false;

  const { url } = message;

  return fetch(url, {
    headers: { 'Accept': 'text/html,text/plain,*/*' },
    credentials: 'omit',
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
      return res.text();
    })
    .then(text => ({ ok: true, text }))
    .catch(err => ({ ok: false, error: err.message }));
});