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