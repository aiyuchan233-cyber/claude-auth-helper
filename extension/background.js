// background.js - minimal downloader for popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download_auth_json') {
    const filename = message.filename || 'auth.json';
    const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(message.content || '');
    chrome.downloads.download({ url: dataUrl, filename: filename, saveAs: false }, (id) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ success: true, downloadId: id });
      }
    });
    return true; // keep channel open
  }
});
