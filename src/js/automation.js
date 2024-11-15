// 等待页面加载完成
window.addEventListener('load', async () => {
  // 使用示例
  var base64String =
    'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADUWVzGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAB3RJ';

  function base64ToBlob(base64Data, contentType, fileName) {
    const sliceSize = 1024;
    const byteCharacters = atob(base64Data);
    const bytesLength = byteCharacters.length;
    const byteArrays = [];

    for (let i = 0; i < bytesLength; i += sliceSize) {
      const slice = byteCharacters.substring(i, i + sliceSize);
      const byteArray = new Uint8Array(slice.length);

      for (let j = 0; j < slice.length; j++) {
        byteArray[j] = slice[j].charCodeAt(0);
      }

      byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });

    // 将Blob包装成File对象
    return new File([blob], fileName, { type: contentType });
  }

  async function saveFile(canvas, filename = 'screenshot') {
    canvas.toBlob(
      function(blob) {
        if (blob) {
          const options = {
            suggestedName: filename,
            types: [
              {
                description: 'Image',
                accept: {
                  'image/png': ['.png'],
                  'image/jpeg': ['.jpg', '.jpeg'],
                },
              },
            ],
          };

          // 显示文件保存对话框
          window
            .showSaveFilePicker(options)
            .then(function(filePickerResult) {
              return filePickerResult.createWriter();
            })
            .then(function(fileWriter) {
              // 将Blob对象写入到所选的文件中
              fileWriter.write(blob);
              // 关闭文件写入操作
              fileWriter.close();
            })
            .catch(function(err) {
              console.error('下载文件时出错：', err);
            });
        }
      },
      'image/png',
      1,
    );
  }

  function getUrlParam(url, key) {
    const reg = new RegExp('[?&]' + key + '=([^&#]*)', 'i');
    const result = url.match(reg);
    return result ? result[1] : null;
  }

  const initAutomation = () => {
    const index = getUrlParam(window.location.href, 'baseIndex');
    // console.log('Index:', index)
    const storeName = 'base64String-' + index;
    chrome.storage.local.get([storeName], result => {
      if (result) {
        // 解析查询字符串
        const base64String = result[storeName].replace(
          /^data:image\/\w+;base64,/,
          '',
        );
        console.log('Parameters received:', base64String);

        // 执行相应的逻辑
        // 例如，调用 WebContainer
        // const base64String = 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADUWVzGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAB3RJ';
        setTimeout(() => {
          // 假设这里是要模拟上传的文件类型，比如image/jpeg
          const contentType = 'image/jpeg';
          // 假设一个文件名，你可以根据实际情况修改
          const fileName = 'test.jpg';
          const fileObject = base64ToBlob(base64String, contentType, fileName);

          // 创建DataTransfer对象并添加File对象
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(fileObject);

          // 获取input文件元素
          const fileInput = document.querySelector('.ysd-upload input');

          // 模拟文件选择事件
          fileInput.files = dataTransfer.files;

          // 触发input元素的click事件
          // fileInput.click();
          fileInput.dispatchEvent(
            new Event('change', { target: fileInput, bubbles: true }),
          );

          // 清理URL对象
          // URL.revokeObjectURL(fileURL);

          // 触发input元素的change事件来启动上传流程
          fileInput.onchange = function() {
            console.log('模拟上传已触发');
          };
        }, 3000);

        setTimeout(() => {
          // 执行检索
          document.querySelector('.feature-item').click();
        }, 5000);
        setTimeout(() => {
          document
            .querySelector(
              '.img-upload-modal .ysd-btn.ysd-btn-primary.ysd-btn-md',
            )
            .click();
          document
            .querySelector('.ysd-form .ysd-btn.ysd-btn-primary.ysd-btn-md')
            .click();
        }, 6000);

        setTimeout(() => {
          html2canvas(document.querySelector('body'), {
            useCORS: true,
            imageTimeout: 0,
          }).then(canvas => {
            saveFile(canvas);
            // let imgSrc = canvas.toDataURL('image/png');
            // let a = document.createElement('a'); // 生成一个a元素
            // let event = new MouseEvent('click'); //创建一个单击事件
            // a.download = 'screenshot'; // 设置图片名称
            // a.href = imgSrc;
            // a.dispatchEvent(event); //触发a的点击事件
          });
        }, 9000);
      }
    });

    // chrome.runtime.onMessage.addListener(function(
    //   message,
    //   sender,
    //   sendResponse,
    // ) {
    //   if (message) {
    //     console.log('收到来自背景脚本的消息：', message);
    //     // 在这里可以对收到的参数进行处理，比如根据消息中的数据进行DOM操作等
    //     const data = message.data;
    //     if (data) {
    //       // 假设这里根据收到的数据进行一个简单的DOM操作示例
    //       const element = document.createElement('div');
    //       element.textContent = `收到的数据：${data.key1} 和 ${data.key2}`;
    //       document.body.appendChild(element);

    //       // 如果需要回复背景脚本，可以调用sendResponse函数
    //       sendResponse({ status: '已收到并处理消息' });
    //     }
    //   }
    // });
  };

  initAutomation();
});
