// popup.js - Claude Auth Helper (minimal)
// 纯本地：把用户输入的 API key 存到 chrome.storage.local，并支持导出 auth.json

document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const exportBtn = document.getElementById('exportBtn');

  // 载入已保存的 key
  chrome.storage.local.get(['claude_api_key'], (res) => {
    if (res && res.claude_api_key) {
      apiKeyInput.value = res.claude_api_key;
    }
  });

  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) { alert('请输入 API Key'); return; }
    chrome.storage.local.set({ claude_api_key: key }, () => {
      alert('已保存到本地（仅浏览器）');
    });
  });

  exportBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (!key) { alert('请输入 API Key 后再导出'); return; }

    // 构造一个简单的 auth.json（你可以按自己的后端期望字段改造）
    const authPayload = {
      provider: "anthropic",
      api_key: key,
      created_at: new Date().toISOString()
    };
    const jsonText = JSON.stringify(authPayload, null, 2);

    // 通过 background 发起下载（避免 popup 生命周期中断）
    chrome.runtime.sendMessage({ action: 'download_auth_json', filename: 'auth.json', content: jsonText }, (resp) => {
      if (chrome.runtime.lastError) {
        console.error('下载通信错误', chrome.runtime.lastError);
        alert('下载失败：' + chrome.runtime.lastError.message);
        return;
      }
      if (resp && resp.success) {
        alert('auth.json 导出已开始（保存到浏览器默认下载目录）');
      } else {
        alert('导出失败');
      }
    });
  });
});
