// worker.js
self.onmessage = function(event) {
  const mhtml = event.data.mhtml;
  const blob = new Blob([mhtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // 创建一个 iframe 来加载 MHTML 内容
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);

  iframe.onload = function() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const iframeContent = iframe.contentWindow.document.body;

    // 设置 canvas 的尺寸
    canvas.width = iframeContent.scrollWidth;
    canvas.height = iframeContent.scrollHeight;

    // 将 iframe 内容绘制到 canvas 上
    context.drawImage(iframe, 0, 0, canvas.width, canvas.height);

    // 将 canvas 转换为图片
    const dataUrl = canvas.toDataURL('image/png');
    self.postMessage({ dataUrl });

    // 清理
    document.body.removeChild(iframe);
    URL.revokeObjectURL(url);
  };
};
