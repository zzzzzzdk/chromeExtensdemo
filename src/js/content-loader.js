// content-loader.js
document.addEventListener('DOMContentLoaded', function() {
  // const head = document.head;
  // if (!head) {
  //   console.error('Document head is not found.');
  //   return;
  // }
  // const script = document.createElement('script');
  // script.src = 'http://localhost:8000/automation.js'; // 替换为你的服务器地址
  // script.onload = function() {
  //   console.log('automation.js loaded successfully');
  // };
  // script.onerror = function() {
  //   console.error('Failed to load automation.js');
  // };
  // head.appendChild(script);
  // chrome.tabs.get(tabId, currentTab => {
  //   if (chrome.runtime.lastError) {
  //     console.error('标签页不存在:', chrome.runtime.lastError);
  //     return;
  //   }
  //   chrome.tabs.executeScript(
  //     tabId,
  //     {
  //       file: 'js/content.js',
  //       allFrames: true,
  //       runAt: 'document_end',
  //     },
  //     () => {
  //       if (chrome.runtime.lastError) {
  //         console.error(
  //           'Error Script execute:',
  //           chrome.runtime.lastError,
  //         );
  //         return;
  //       }
  //       console.log(`标签页： ${tabId} Script executed successfully`);
  //     },
  //   );
  // });
});
