chrome.action.onClicked.addListener((tab) => {
  let url = tab.url;
  
  if (url.startsWith("view-source:")) {
    url = url.replace(/^view-source:/, "");
  }

  if (url.startsWith("http")) {
    const viewerUrl = chrome.runtime.getURL("viewer.html") + "?url=" + encodeURIComponent(url);
    chrome.tabs.create({ url: viewerUrl });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'loading') return;
  const url = tab.url || changeInfo.url || '';
  if (!url.startsWith('view-source:')) return;

  const targetUrl = url.slice('view-source:'.length);
  const viewerUrl = chrome.runtime.getURL('viewer.html')
    + '?url=' + encodeURIComponent(targetUrl);

  chrome.tabs.update(tabId, { url: viewerUrl });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'FETCH_SOURCE') return false;

  const { url } = message;

  fetch(url, {
    headers: { 'Accept': 'text/html,text/plain,*/*' },
    credentials: 'omit',
  })
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
      return res.text();
    })
    .then(text => sendResponse({ ok: true, text }))
    .catch(err => sendResponse({ ok: false, error: err.message }));

  return true;
});