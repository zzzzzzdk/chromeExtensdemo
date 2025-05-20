// content-loader.js（内容脚本）
document.addEventListener('DOMContentLoaded', function() {
  // 通过消息触发背景脚本执行注入
  chrome.runtime.sendMessage(
    {
      job: 'inject_automation',
    },
    function(response) {
      // console.log('保存图片结果:', response)
    },
  );
});
