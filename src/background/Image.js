import data from './data';
import { logEvent } from '../utils/bello';
import GL from '../utils/getLocale';
import { fetchBlob, convertDataURIToBinary } from '../utils';
import { reverseImageSearch } from 'SRC/js/reverseImageSearch.js';
import { engineMap } from 'SRC/constant/settingMap.js';
import { apiUrls } from 'SRC/constant/searchApiUrl.js';
import { get, set, getDB, setDB } from 'SRC/utils/db.js';
import ajax from 'SRC/utils/ajax.js';
import { checkUrlOrBase64 } from 'SRC/utils/imageUtils';
import { createNewTab, generateNewTabUrl } from 'SRC/utils/browserUtils';
import { AllowIps } from 'SRC/constant/constants';

export default class Image {
  constructor() {
    this.noobUploadUrl;
    this.noobDownLoadUrl;
    this.updateImageUploadUrl('ainoob.com');
    this.updateImageDownloadUrl('ainoob.com');
    this.noobFetchImageServerUrls = 'https://ainoob.com/api/get/imageServers/';
    this.fetchFunction = {
      googleLink: reverseImageSearch.fetchGoogleLink,
      baiduLink: reverseImageSearch.fetchBaiduLink,
      yituLink: reverseImageSearch.fetchYituLink,
      // tineyeLink: reverseImageSearch.fetchTineyeLink,
      // bingLink: reverseImageSearch.fetchBingLink,
      // yandexLink: reverseImageSearch.fetchYandexLink,
      // saucenaoLink: reverseImageSearch.fetchSauceNaoLink,
      // iqdbLink: reverseImageSearch.fetchIQDBLink,
      // ascii2dLink: reverseImageSearch.fetchAscii2dLink,
    };
  }

  updateImageUploadUrl(server) {
    this.noobUploadUrl = 'https://' + server + '/api/uploadImage/';
  }

  updateImageDownloadUrl(server) {
    this.noobDownLoadUrl = 'https://' + server + '/api/getImage/';
  }

  async init() {
    const _this = this;
    // 监听标签页激活事件
    chrome.tabs.onActivated.addListener(async activeInfo => {
      chrome.tabs.get(activeInfo.tabId, tab => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
          return;
        }
        checkTabUrl(tab.url);
      });
    });

    // 监听标签页更新事件
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.url) {
        checkTabUrl(changeInfo.url);
      }
    });

    // 监听来自弹出窗口的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'getAllowedHandle') {
        sendResponse({ allowHandle: data.allowHandle });
      }
    });

    // 检查URL是否符合允许的IP条件
    async function checkTabUrl(url) {
      // console.log('checkurl', url)
      // 先清除右键绑定
      _this.removeContextMenu();
      try {
        const hostname = new URL(url).hostname;
        if (isAllowedIP(hostname)) {
          console.log(`URL ${url} is allowed.`);
          await _this.updateImageSearchContextMenu();
          await _this.updateExtractImageContextMenu();
          await _this.updateScreenshotSearchContextMenu();
          data.allowHandle = true;
        } else {
          data.allowHandle = false;
          // console.log(`URL ${url} is not allowed.`);
        }
      } catch (error) {
        console.error(error);
      }
    }

    // 判断主机名是否为允许的IP地址
    function isAllowedIP(hostname) {
      return AllowIps.includes(hostname);
    }

    // await this.getUploadServer();
  }

  async getUploadServer() {
    const serverUrls = (await ajax(this.noobFetchImageServerUrls, {})).data;
    let fastestServer = null;
    const pingPath = '/search';
    serverUrls.forEach(async server => {
      let startTime = new Date().getTime();
      await ajax('https://' + server + pingPath);
      console.log(
        'fetched after ' + (new Date().getTime() - startTime) + 'ms: ' + server,
      );
      if (!fastestServer) {
        fastestServer = server;
        this.updateImageUploadUrl(server);
        this.updateImageDownloadUrl(server);
      }
    });
  }

  async updateScreenshotSearchContextMenu() {
    if (await get('screenshotSearch')) {
      data.Image.screenshotSearchHandle = browser.contextMenus.create({
        id: 'screenshotSearch',
        title: GL('screenshot_search'),
        contexts: ['all'],
        onclick: this.screenshotSearch,
      });
    } else {
      if (data.Image.screenshotSearchHandle) {
        browser.contextMenus.remove(data.Image.screenshotSearchHandle);
        data.Image.screenshotSearchHandle = null;
      }
    }
  }
  async screenshotSearch(info, tab) {
    browser.tabs.sendMessage(tab.id, 'loaded', response => {
      if (response == 'yes') {
        browser.tabs.captureVisibleTab(tab.windowId, dataURL => {
          browser.tabs.sendMessage(tab.id, {
            job: 'screenshotSearch',
            data: dataURL,
          });
        });
      } else {
        browser.tabs.captureVisibleTab(tab.windowId, dataURL => {
          browser.tabs.executeScript(
            tab.id,
            { file: 'thirdParty/jquery.min.js' },
            () => {
              if (browser.runtime.lastError) {
                browser.notifications.create(
                  'screenshotFailed',
                  {
                    type: 'basic',
                    iconUrl: '/images/icon_128x128.png',
                    title: GL('ls_1'),
                    message: GL('ls_2'),
                  },
                  voidFunc,
                );
                return;
              }
              browser.tabs.executeScript(
                tab.id,
                { file: 'js/screenshotSearch.js' },
                () => {
                  browser.tabs.sendMessage(tab.id, {
                    job: 'screenshotSearch',
                    data: dataURL,
                  });
                },
              );
            },
          );
        });
      }
    });
  }
  async updateImageSearchContextMenu() {
    if (await get('imageSearch')) {
      data.Image.imageSearchHandle = browser.contextMenus.create({
        id: 'imageSearch',
        title: GL('search_this_image'),
        contexts: ['image'],
        onclick: image => {
          this.beginImageSearch(image.srcUrl);
        },
      });
    } else {
      if (data.Image.imageSearchHandle) {
        browser.contextMenus.remove(data.Image.imageSearchHandle);
        data.Image.imageSearchHandle = null;
      }
    }
  }

  async updateExtractImageContextMenu() {
    if (await get('extractImages')) {
      data.Image.extractImageHandle = browser.contextMenus.create({
        id: 'extractImages',
        title: GL('extract_images'),
        contexts: ['all'],
        onclick: this.extractImages,
      });
    } else {
      if (data.Image.extractImageHandle) {
        browser.contextMenus.remove(data.Image.extractImageHandle);
        data.Image.extractImageHandle = null;
      }
    }
  }

  removeContextMenu() {
    if (data.Image.screenshotSearchHandle) {
      browser.contextMenus.remove(data.Image.screenshotSearchHandle);
      data.Image.screenshotSearchHandle = null;
    }
    if (data.Image.imageSearchHandle) {
      browser.contextMenus.remove(data.Image.imageSearchHandle);
      data.Image.imageSearchHandle = null;
    }
    if (data.Image.extractImageHandle) {
      browser.contextMenus.remove(data.Image.extractImageHandle);
      data.Image.extractImageHandle = null;
    }
  }
  // 提取图片
  extractImages(info, tab) {
    logEvent({
      category: 'extractImages',
      action: 'run',
    });
    browser.tabs.sendMessage(
      tab.id,
      {
        job: 'extractImages',
      },
      {
        frameId: info.frameId,
      },
      response => {
        if (!response) {
          browser.notifications.create(
            'extractImages',
            {
              type: 'basic',
              iconUrl: '/static/nooboxLogos/icon_128x128.png',
              title: GL('extractImages'),
              message: GL('ls_4'),
            },
            () => {},
          );
        }
        console.log('Last error:', browser.runtime.lastError);
      },
    );
  }
  downloadExtractImages(sender, files) {
    logEvent({
      category: 'downloadExtractImages',
      action: 'run',
    });
    const zip = new JSZip();
    let remains = files.length;
    let total = files.length;
    let i = 0;
    let file = files[i];
    // console.log(file);
    const reader = new window.FileReader();
    reader.onloadend = () => {
      // console.log(remains);
      addImage(reader.result);
    };
    function addImage(dataURI) {
      if (dataURI) {
        const ext = (dataURI.slice(0, 20).match(/image\/(\w*)/) || ['', ''])[1];
        const binary = convertDataURIToBinary(dataURI);
        // console.log(binary);
        zip.file(file.name + '.' + ext, binary, {
          base64: false,
        });
      } else {
        total--;
      }
      remains--;
      chrome.tabs.sendMessage(
        sender.tab.id,
        {
          job: 'downloadRemaining',
          remains: remains,
          total: total,
        },
        () => {},
      );
      if (remains == 0) {
        zip
          .generateAsync({
            type: 'blob',
          })
          .then(content => {
            saveAs(content, 'NooBox.zip');
          });
      } else {
        file = files[++i];
        if (file.url.slice(0, 4) == 'data') {
          addImage(file.url);
        } else {
          fetchBlob(file.url, blob => {
            if (blob) {
              reader.readAsDataURL(blob);
            } else {
              addImage();
            }
          });
        }
      }
    }
    if (file.url.slice(0, 4) == 'data') {
      addImage(file.url);
    } else {
      fetchBlob(file.url, blob => {
        if (blob) {
          reader.readAsDataURL(blob);
        } else {
          addImage();
        }
      });
    }
  }
  async loadImageHistory(cursor) {
    let url = await generateNewTabUrl('searchResult.html');
    await createNewTab({
      url: url + '#/' + cursor,
      active: await get('imageSearchNewTabFront'),
    });
  }
  /**
   *
   * @param {*} param0
   * data: 单张为base64或者url，多张为数组
   */
  async beginImageSearch(data) {
    const _this = this;
    let cursor = await getDB('imageCursor');
    if (typeof cursor === 'number') {
      cursor++;
      await setDB('imageCursor', cursor);
    } else {
      cursor = 0;
      await setDB('imageCursor', cursor);
    }

    if (!Array.isArray(data)) {
      // _this.traverseFetch(data, cursor);
      _this.getImageSearchResult(data);
    } else {
      // window.searchResult
      data.forEach(async (item, index) => {
        // 生成一个0到9秒之间的随机延迟时间（以毫秒为单位）
        const randomDelay = Math.floor(Math.random() * 9000);
        setTimeout(() => {
          _this.getImageSearchResult(item, index);
        }, randomDelay);
        // _this.traverseFetch(item, cursor)
      });
    }

    // // 跳转到结果页
    // let url = await generateNewTabUrl('searchResult.html');
    // await createNewTab({
    //   url: url + '#/' + cursor,
    //   active: await get('imageSearchNewTabFront'),
    // });
  }

  async getImageSearchResult(base64String, index = 0) {
    const params = {
      [`base64String-${index}`]: base64String,
    };

    // 存储参数
    chrome.storage.local.set({ ...params }, async () => {
      console.log('Parameters stored in storage');

      // 创建新标签页
      const tab = await chrome.tabs.create(
        {
          url: 'http://localhost:8081/index.html#/image?baseIndex=' + index,
          active: false,
        },
        async tab => {
          // await chrome.runtime.sendMessage(
          //   {
          //     job: 'autoUploadAndSearch',
          //     category: 'autoUploadAndSearch',
          //     action: 'run',
          //     base64String: item,
          //     cursor: cursor,
          //     tabId: tab.id,
          //   },
          //   function(response) {
          //     console.log(response)
          //   },
          // );
          chrome.tabs.executeScript(tab.id, {
            // file: '/js/automation.js',
            code: `
             var element = document.createElement('div');
          element.textContent = '这是根据参数在新标签页创建的元素：' + receivedParams.message;
          document.body.appendChild(element);`,
            runAt: 'document_idle',
          });
          // setTimeout(() => {
          //   chrome.tabs.sendMessage(
          //     tab.id,
          //     {
          //       job: 'autoUploadAndSearch',
          //       category: 'autoUploadAndSearch',
          //       action: 'run',
          //       base64String: item,
          //       cursor: cursor,
          //       tabId: tab.id,
          //     },
          //     function(response) {
          //       if (response) {
          //         console.log('收到来自指定标签页的回复：', response);
          //       } else {
          //         console.log('未收到指定标签页的回复');
          //       }
          //     },
          //   );
          // }, 2000);

          // setTimeout(() => {

          // }, 5000);
        },
      );
    });
  }
  // 遍历接口执行请求
  async traverseFetch(data, cursor) {
    let base64Flag = checkUrlOrBase64(data) === 'url' ? false : true;
    let imageLink = data;

    if (imageLink) {
      let resultObj = {
        searchImageInfo: [],
        searchResult: [],
        engineLink: {},
        base64Flag: base64Flag,
        base64: base64Flag ? data : '',
        url: !base64Flag ? data : '',
      };
      //Get Opened Engine and send request
      for (let i = 0; i < engineMap.length; i++) {
        let dbName = engineMap[i].dbName;
        let name = engineMap[i].name;
        let check = await get(dbName);
        if (check && this.fetchFunction[name + 'Link']) {
          resultObj.engineLink[name] = apiUrls[name] + imageLink;
          if (name == 'yitu') {
            this.fetchFunction[name + 'Link'](apiUrls[name], cursor, resultObj);
          } else {
            this.fetchFunction[name + 'Link'](
              apiUrls[name] + imageLink,
              cursor,
              resultObj,
            );
          }
        }
      }
    }

    // //Check base64 or Url
    // switch (checkUrlOrBase64(data)) {
    //   case 'base64':
    //     // console.log("here");
    //     base64Flag = true
    //     await setDB(cursor, { base64: data });

    //     logEvent({
    //       category: 'imageSearch',
    //       action: 'dataURI',
    //     });
    //     break;
    //   case 'url':
    //     base64Flag = false
    //     // console.log(data);
    //     logEvent({
    //       category: 'imageSearch',
    //       action: 'url',
    //     });
    //     break;
    //   default:
    //     break;
    // }
    // await setDB(cursor, { url: data });
  }
}
