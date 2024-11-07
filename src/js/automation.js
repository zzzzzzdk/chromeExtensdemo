
// 等待页面加载完成
window.addEventListener('load', () => {
  // var input = document.createElement('input');
  // input.id = "upload-image";
  // input.type = "file";
  // document.body.appendChild(input)
  // var inputbtn = document.createElement('input');
  // inputbtn.id = "search-button";
  // inputbtn.type = "button";
  // inputbtn.value = "按钮";
  // document.body.appendChild(inputbtn);
  // // 选择上传图片的输入框和检索按钮
  // const uploadInput = document.getElementById('upload-image');
  // const searchButton = document.getElementById('search-button');

  // 监听消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'autoUploadAndSearch') {
      autoUploadAndSearch(uploadInput, searchButton);
    }
  });

  // 自动执行
  // autoUploadAndSearch(uploadInput, searchButton);

});

function autoUploadAndSearch(uploadInput, searchButton) {
  // 创建一个File对象
  const file = new File([""], "example.jpg", { type: "image/jpeg" });

  // 触发输入框的change事件
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(file);
  uploadInput.files = dataTransfer.files;
  uploadInput.style = 'border-color: red;'

  // 模拟用户选择文件
  const changeEvent = new Event('change', { bubbles: true });
  uploadInput.dispatchEvent(changeEvent);

  // 等待一段时间后点击检索按钮
  setTimeout(() => {
    searchButton.click();
  }, 1000); // 根据实际情况调整等待时间
}