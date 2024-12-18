window.isinit = false;
window.addEventListener('load', () => {
  // 等待页面加载完成
  // 使用示例
  // var base64String ='iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADUWVzGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAB3RJ';
  this.currentSszTask = {};
  var massageListener;

  function base64ToBlob(base64Data, contentType, filename) {
    // 去除可能存在的前缀
    const base64String = base64Data.replace(
      /^data:image\/(png|jpeg);base64,/,
      '',
    );
    const sliceSize = 1024;
    const byteCharacters = atob(base64String);
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
    return new File([blob], filename, { type: contentType });
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
  function sleep(ms) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, ms);
    });
  }
  function waitForLoadingElementToDisappear(doc = document) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const loadingElement = document.querySelector(
          '.page1.line .discom .h-an-icon-loading',
        );
        const loadingBox = document.querySelector('.loading-box');
        let loadingShow = document.querySelector('.el-loading-mask');
        let blockLoading = doc.querySelector('.block-loading');
        if (loadingShow) {
          loadingShow = loadingShow.style.display != 'none';
        }

        if (blockLoading) {
          blockLoading = blockLoading.style.display != 'none';
        }

        if (!loadingElement && !loadingBox && !loadingShow && !blockLoading) {
          // 如果没有找到具有loading类名的元素，说明它已经消失了，清除定时器并 resolve
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });
  }

  function runAutomation(message) {
    const {
      filename,
      base64,
      savePath,
      tabId,
      platform,
      provinceCheckedList,
    } = message;
    // // return new Promise(async (resolve, reject) => {
    // // await sleep(5000);
    // try {
    //   html2canvas(document.querySelector('body'), {
    //     useCORS: true,
    //     imageTimeout: 0,
    //   }).then(canvas => {
    //     let imgSrc = canvas.toDataURL('image/png');

    //     chrome.runtime.sendMessage(
    //       {
    //         job: 'saveCanvasData',
    //         dataUrl: imgSrc,
    //         filename: filename,
    //         savePath: 'E:/研判',
    //         tabId: tabId,
    //       },
    //       function(response) {
    //         // console.log('保存图片结果:', response)
    //       },
    //     );
    //   });
    // } catch (error) {
    //   console.log(error);
    // }
    // return;

    // 判断是省平台还是部平台
    if (platform === 'bsz') {
      bszAutomation(message);
    } else {
      if (message.filename != this.currentSszTask.filename) {
        this.currentSszTask = { ...message };
        sszAutomation(message);
      }
    }

    // });
  }

  var firstAutomation = true;

  async function bszAutomation(message) {
    console.log(`bsz执行自动化任务: ${message.filename}`, message);
    const {
      filename,
      base64,
      savePath,
      tabId,
      platform,
      provinceCheckedList,
      startDate,
      endDate,
    } = message;
    // 执行之前判断页面是否有元素，有的话代表之前执行过任务
    const clickImgBg = document.querySelector('.click-img-bg');
    if (clickImgBg) {
      document.querySelector('.click-img-bg .h-icon-delete').click();
    }

    // 解析查询字符串
    const base64String = base64;

    // 执行相应的逻辑
    // 例如，调用 WebContainer

    await sleep(3000);

    // 假设这里是要模拟上传的文件类型，比如image/jpeg
    const contentType = 'image/jpeg';
    // 假设一个文件名，你可以根据实际情况修改
    const fileObject = base64ToBlob(base64String, contentType, filename);

    // 创建DataTransfer对象并添加File对象
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(fileObject);

    // 获取input文件元素
    const fileInput = document.querySelector('.el-upload .el-upload__input');

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

    await sleep(2000);
    await waitForLoadingElementToDisappear();
    await sleep(2000);
    // 执行检索
    const featureItemFirst = document.querySelector(
      '.h-target-img-upload__details-thumbnail-item',
    );
    const featureSubBtn = document.querySelector(
      '.h-target-img-upload__footer .el-button',
    );
    // 未识别目标，直接保存，让程序运行下一张图
    if (!featureItemFirst) {
      try {
        chrome.runtime.sendMessage(
          {
            job: 'saveCanvasData',
            // dataUrl: imgSrc,
            filename: filename,
            savePath: savePath + '/低分',
            tabId: tabId,
          },
          function(response) {
            // console.log('保存图片结果:', response)
          },
        );
      } catch (error) {
        console.log(error);
      }
      return;
    }
    if (featureItemFirst.classList.contains('is-active')) {
      featureSubBtn.click();
    } else {
      featureItemFirst.click();
      featureSubBtn.click();
    }

    // 第一次检索的时候选中全部省份，修改时间
    if (firstAutomation) {
      await sleep(1000);

      document
        .querySelector('.data-range-container .container-right')
        .setAttribute('style', 'display:block;');

      await sleep(800);
      // 选中省份全部
      const allBtns = document.querySelectorAll(
        '.inner-distribute-item .handle-btn-distri .inner-single-btn',
      );
      // allBtns.forEach((elem, index) => {
      //   // if (index > 1) return;
      //   const spanEle = elem.querySelector('span');
      //   if (spanEle && spanEle.textContent.includes('全部')) {
      //     elem.click();
      //   }
      // });

      allBtns.forEach(elem => {
        const spanEle = elem.querySelector('span');
        if (spanEle) {
          const spanText = spanEle.textContent.trim();
          if (
            provinceCheckedList.some(province => spanText.includes(province))
          ) {
            elem.click();
          }
        }
      });

      document
        .querySelector('.data-range-container .container-right')
        .setAttribute('style', 'display:none;');

      // -------修改时间
      const dataInputArea = document.querySelector(
        'div.topWrap.deep-topWrap > div.h-page-search.deep-page-search.row-amount-6 > form > div.h-page-search-item.searchItem > div > div > div',
      );
      if (dataInputArea && startDate && endDate) {
        dataInputArea.click();
        await sleep(1000);
        const startDateInput = document.querySelector(
          'div.topWrap.deep-topWrap > div.h-page-search.deep-page-search.row-amount-6 > form > div.h-page-search-item.searchItem > div > div > div > input:nth-child(1)',
        );
        const endDateInput = document.querySelector(
          'div.topWrap.deep-topWrap > div.h-page-search.deep-page-search.row-amount-6 > form > div.h-page-search-item.searchItem > div > div > div > input:nth-child(3)',
        );
        startDateInput.value = startDate;
        endDateInput.value = endDate;

        startDateInput.dispatchEvent(new Event('input'));
        startDateInput.dispatchEvent(new Event('change'));

        endDateInput.dispatchEvent(new Event('input'));
        endDateInput.dispatchEvent(new Event('change'));
        await sleep(1000);
        const dataOk = document.querySelector(
          'div.el-picker-panel.el-date-range-picker.el-popper.has-time > div.el-picker-panel__footer > button.el-button.el-picker-panel__link-btn.el-button--primary',
        );
        dataOk.click();
      }

      firstAutomation = false;
    }

    await sleep(1200);
    document
      .querySelector('button.el-button.search-btn.el-button--primary')
      .click();
    await sleep(1000);
    document
      .querySelector(
        'body > div.el-dialog__wrapper > div > div.el-dialog__footer > span > button',
      )
      .click();

    // 调用函数开始轮询查找并等待loading元素消失
    await waitForLoadingElementToDisappear();
    // 在这里进行你想要的后续操作，比如加载新的内容、执行某个函数等
    // console.log('loading元素已经消失，可以进行后续操作了');
    await sleep(500);
    // 点击到融合查询
    document
      .querySelector(
        '#app > div > section > div > div.deep-layout > section > div > div > div.page1.line > div:nth-child(1)',
      )
      .click();
    // 查询到页面上有没有90%相似度以上的数据，有的话截图
    await sleep(2000);
    let newFilename = filename;
    let similarityScore = '低分';

    const resultsFirst = document.querySelectorAll('.demo-img-wrapper')[0];
    if (resultsFirst) {
      const similarText = resultsFirst.querySelector('.el-progress__text')
        .innerText;
      const number = parseInt(similarText);
      if (number > 90) {
        similarityScore = '高分';
      } else if (similarityScore >= 80) {
        similarityScore = '中分';
      } else {
        similarityScore = '低分';
      }
      newFilename = similarText + '_' + newFilename;
    }

    let newSavePath = savePath + '/' + similarityScore;

    await sleep(5000);
    // htmlcanvas2截图无法截取不可见的tab
    // if (hasLight) {
    // html2canvas(document.querySelector('body'), {
    //   allowTaint: true,
    //   useCORS: true,
    // }).then(async canvas => {
    //   let imgSrc = canvas.toDataURL('image/png');

    //   await sleep(2000);
    //   chrome.runtime.sendMessage(
    //     {
    //       job: 'saveCanvasData',
    //       dataUrl: imgSrc,
    //       filename: newFilename,
    //       savePath: newSavePath,
    //       tabId: tabId,
    //     },
    //     function (response) {
    //       // console.log('保存图片结果:', response)
    //     },
    //   );
    // });
    // }

    try {
      chrome.runtime.sendMessage(
        {
          job: 'saveCanvasData',
          // dataUrl: imgSrc,
          filename: newFilename,
          savePath: newSavePath,
          tabId: tabId,
        },
        function(response) {
          // console.log('保存图片结果:', response)
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  async function sszAutomation(message) {
    console.log(`ssz执行自动化任务: ${message.filename}`, message);

    await sleep(3000);

    const iframeold = document.getElementById('isearch_search_7');
    if (!iframeold) {
      const navAll = document.querySelector(
        'body > div.page-appCenter > div.c-headNav-nav1.head-wrap > div.head-container > div.nav-bar.dark > div.btn-menu-wrap > i',
      );
      if (!navAll) {
        return;
      }
      const mouseEnterEvent = new MouseEvent('mouseenter', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      navAll.dispatchEvent(mouseEnterEvent);
      await sleep(500);

      const navs = document.querySelectorAll(
        'body > div.page-appCenter > div.m-nav-quick.nav1.visible > div > div > div.nav-scrollbar__wrap.el-scrollbar__wrap > div > div:nth-child(3) > ul > li',
      );
      navs.forEach(child => {
        if (child.textContent.includes('以脸搜脸')) {
          child.click();
        }
      });
      await sleep(1000);
      const checkinterval = setInterval(async () => {
        const iframe = document.getElementById('isearch_search_7');
        if (iframe) {
          clearInterval(checkinterval);
          const iframeDoc =
            iframe.contentDocument || iframe.contentWindow.document;

          await waitForLoadingElementToDisappear(iframeDoc);
          await sleep(1000);

          iframeAuto(message, iframeDoc);
        }
      }, 500);
    } else {
      // // 执行之前判断页面是否有元素，有的话代表之前执行过任务
      const iframeDoc =
        iframeold.contentDocument || iframeold.contentWindow.document;
      const clickImgBg = iframeDoc.querySelector('.click_but_wrap');
      if (clickImgBg) {
        clickImgBg.querySelector('.img-bottom-action').style.height = '40px';
        clickImgBg.querySelector('.img-bottom-action .right_delete').click();
      }
      await sleep(1000);

      iframeAuto(message, iframeDoc);
    }

    // 执行相应的逻辑
    // 例如，调用 WebContainer

    // await sleep(3000);
  }

  async function iframeAuto(params, iframeDoc) {
    const { filename, base64, savePath, tabId, platform, sliderValue } = params;

    // 获取input文件元素
    const fileInput = iframeDoc.querySelector(
      '.imgResult-hearder .img-result-header-left  div.upload-card-item .bg-item .el-upload__input',
    );
    if (!fileInput) {
      return;
    }

    // 解析查询字符串
    const base64String = base64;
    // 假设这里是要模拟上传的文件类型，比如image/jpeg
    const contentType = 'image/jpeg';
    // 假设一个文件名，你可以根据实际情况修改
    const fileObject = base64ToBlob(base64String, contentType, filename);

    // 创建DataTransfer对象并添加File对象
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(fileObject);

    await sleep(1000);

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

    await sleep(2000);
    await waitForLoadingElementToDisappear();
    await sleep(2000);

    // 省时间默认选5天
    const dateSelector = iframeDoc.querySelector(
      'div.imgResult-hearder > div > div.hearer_right_wrap > div > div.hearer_right_wrap_L2 > div.pick-time-wrapper.hearer_right_text-right > div.el-radio-group.is-radio-group > div:nth-child(3) > label',
    );
    if (dateSelector) {
      dateSelector.click();
    }

    // 自动化修改滑块和输入框的值
    function automateSliderValue(newValue) {
      // 目标相似度修改
      const similarInput = iframeDoc.querySelector(
        'div.imgResult-hearder > div > div.hearer_right_wrap > div > div.hearer_right_wrap_L3 > div.minSimilar_wrap > span.el-popover-wrap.tooltip-item > div > div > input',
      );
      similarInput.value = newValue;
      similarInput.dispatchEvent(
        new Event('input', { target: similarInput, bubbles: true }),
      );
      similarInput.onchange = function() {
        console.log('模拟修改阈值已触发');
      };
      // 获取滑块和输入框的 DOM 元素
      const sliderHandle = iframeDoc.querySelector(
        'div.imgResult-hearder > div > div.hearer_right_wrap > div > div.hearer_right_wrap_L3 > div.minSimilar_wrap > span:nth-child(3) > div > div > div.el-slider__runway-click-area',
      );

      // 模拟滑块的拖动
      const rect = sliderHandle.getBoundingClientRect();
      const x = rect.left + (rect.width / 99) * newValue;
      const y = rect.top + rect.height / 2;

      // 触发鼠标事件
      const mouseDownEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y,
      });
      sliderHandle.dispatchEvent(mouseDownEvent);
    }

    // 获取当前modal
    let modals = iframeDoc.querySelectorAll(
      '.el-dialog__wrapper.h-target-img-upload__dialog',
    );
    let openModal;
    modals.forEach(modal => {
      if (modal.style.display != 'none') {
        openModal = modal;
      }
    });

    if (openModal) {
      // 执行检索
      const featureItemFirst = openModal.querySelector(
        '.h-target-img-upload__details-thumbnail-item',
      );
      const featureSubBtn = openModal.querySelector(
        '.h-target-img-upload__footer .el-button',
      );

      // 未识别目标，直接保存，让程序运行下一张图
      if (!featureItemFirst) {
        try {
          chrome.runtime.sendMessage(
            {
              job: 'saveCanvasData',
              // dataUrl: imgSrc,
              filename: filename,
              savePath: savePath + '/低分',
              tabId: tabId,
            },
            function(response) {
              // console.log('保存图片结果:', response)
            },
          );
        } catch (error) {
          console.log(error);
        }
        return;
      }

      if (featureItemFirst.classList.contains('is-active')) {
        featureSubBtn.click();
      } else {
        featureItemFirst.click();
        await sleep(500);
        featureSubBtn.click();
      }
    }
    await sleep(1200);

    // 示例：将滑块和输入框的值设置为 50
    automateSliderValue(sliderValue);
    await sleep(1000);

    const searchBtn = iframeDoc.querySelector(
      '.el-button.search_but.el-button--primary',
    );
    searchBtn.click();
    // 调用函数开始轮询查找并等待loading元素消失
    await waitForLoadingElementToDisappear();
    // 在这里进行你想要的后续操作，比如加载新的内容、执行某个函数等
    // console.log('loading元素已经消失，可以进行后续操作了');
    await sleep(500);

    let newFilename = filename;
    let similarityScore = '低分';

    const resultsFirst = iframeDoc.querySelectorAll('.card-item')[0];
    if (resultsFirst) {
      const similarText = resultsFirst.querySelector('.similarity').innerText;
      const number = parseInt(similarText);
      if (number >= 90) {
        similarityScore = '高分';
      } else if (number >= 80 && number < 90) {
        similarityScore = '中分';
      } else {
        similarityScore = '低分';
      }
      newFilename = similarText + '_' + newFilename;
    }

    let newSavePath = savePath + '/' + similarityScore;

    await sleep(2000);
    try {
      chrome.runtime.sendMessage(
        {
          job: 'saveCanvasData',
          // dataUrl: imgSrc,
          filename: newFilename,
          savePath: newSavePath,
          tabId: tabId,
        },
        function(response) {
          // console.log('保存图片结果:', response)
        },
      );
    } catch (error) {
      console.log(error);
    }
  }

  const initAutomation = () => {
    // const base64String = 'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAMAAADUWVzGAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAB3RJ';
    if (window.isinit) {
      console.log('已经初始化，不再重复');
      return;
    }

    window.isinit = true;

    if (massageListener) {
      chrome.runtime.onMessage.removeListener(messageListener);
    }

    messageListener = (message, sender, sendResponse) => {
      if (message.action === 'runAutomation') {
        runAutomation(message);
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);
  };

  if (window.top === window.self) {
    initAutomation();
  } else {
    console.log('当前脚本运行在iframe中，不执行init');
  }
});
