import userBrowser from '../utils/useBrowser';
import AutoRefresh from './AutoRefresh';
import Image from './Image';
import Options from './Options';
import {
  getCurrentTab,
  sendMessage,
  sendTabMessage,
} from 'SRC/utils/browserUtils';
import { getDB, set, deleteDB } from '../utils/db';
import { wait } from '../utils';
import { logEvent } from '../utils/bello';
import { apiUrls } from 'SRC/constant/searchApiUrl.js';

userBrowser();

const port = chrome.runtime.connectNative('com.yisa.nativeapp');

port.onMessage.addListener(response => {
  console.log('Received: ', response);
  browser.notifications.clear('saveScreenshotPng');
  const { status, path, action } = response;
  if (action === 'download') {
    //   if (status === 'success') {
    //     browser.notifications.create(
    //       'saveScreenshotPng',
    //       {
    //         type: 'basic',
    //         iconUrl: '/static/nooboxLogos/icon_128x128.png',
    //         title: '文件保存成功',
    //         message: `${path}`,
    //       },
    //       id => {
    //         console.log(chrome.runtime.lastError);
    //       },
    //     );
    //   } else {
    //     browser.notifications.create(
    //       'saveScreenshotPng',
    //       {
    //         type: 'basic',
    //         iconUrl: '/static/nooboxLogos/icon_128x128.png',
    //         title: '文件保存失败',
    //         message: `${path}`,
    //       },
    //       () => {},
    //     );
    //   }
  } else {
    console.log(response);
  }
});

/*
Listen for the native messaging port closing.
*/
port.onDisconnect.addListener(port => {
  if (port.error) {
    console.log(`Disconnected due to an error: ${port.error.message}`);
  } else {
    // The port closed for an unspecified reason. If this occurred right after
    // calling `chrome.runtime.connectNative()` there may have been a problem
    // starting the the native messaging client in the first place.
    // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Native_messaging#troubleshooting
    console.log(`Disconnected`, port);
  }
});

chrome.runtime.onConnect.addListener(port => {
  if (port.name === 'contentScriptPort') {
    port.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'requestTabId') {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          const currentTabId = tabs[0].id;
          port.postMessage({ type: 'tabId', tabId: currentTabId });
        });
      }
    });
  }
});

const autoRefresh = new AutoRefresh();
const image = new Image();
const options = new Options();

let lastVideoControl = 0;

let taskStorePath = '';
let taskQueue = [];
// 保持运行的脚本的tab
let activeTabs = [];
// 初次加载使用的tab，
const processedTabs = new Map();

chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension installed');
});

browser.tabs.onRemoved.addListener(tabId => {
  autoRefresh.delete(tabId);
});

// cannot be async if sending response back
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (!request.job) {
    return;
  }
  const job = request.job;
  // console.log(request);
  if (job === 'updateAutoRefresh') {
    const { tabId, interval, active, startAt } = request;
    const autoRefreshStatus = autoRefresh.update(
      tabId,
      active,
      interval,
      startAt,
      true,
    );
    sendResponse(autoRefreshStatus);
  } else if (job === 'set') {
    const { key, value } = request;
    await set(key, value);
    switch (key) {
      case 'extractImages':
        await image.updateExtractImageContextMenu();
        break;
      case 'screenshotSearch':
        await image.updateScreenshotSearchContextMenu();
        break;
      case 'imageSearch':
        await image.updateImageSearchContextMenu();
        break;
      case 'videoControl':
        browser.tabs.query({}, tabs => {
          for (let i = 0; i < tabs.length; i++) {
            browser.tabs.sendMessage(
              tabs[i].id,
              {
                job: 'videoControlContentScriptSelfCheck',
              },
              () => {},
            );
          }
        });
        break;
      default:
    }
  } else if (job === 'getCurrentTabAutoRefreshStatus') {
    const { tabId } = request;
    const autoRefreshStatus = autoRefresh.getStatus(tabId);
    sendResponse(autoRefreshStatus);
  } else if (job === 'beginImageSearch') {
    const { data } = request;
    image.beginImageSearch(data);
    // browser.tabs.create({ url:"/searchResult.html" });
  } else if (job === 'loadImageHistory') {
    const { cursor } = request;
    image.loadImageHistory(cursor);
  } else if (job == 'urlDownloadZip') {
    image.downloadExtractImages(sender, request.files);
  } else if (job == 'getDB') {
    const value = await getDB(request.key);
    browser.tabs.sendMessage(sender.tab.id, {
      job: 'returnDB',
      key: request.key,
      data: value,
    });
  } else if (job === 'analytics') {
    logEvent({
      category: request.category,
      action: request.action,
      label: request.label,
      value: request.value,
    });
  } else if (job == 'videoControlUse') {
    const time = new Date().getTime();
    if (lastVideoControl + 10 * 60 * 1000 < time) {
      lastVideoControl = time;
      logEvent({
        category: 'videoControl',
        action: 'run',
        label: '',
      });
    }
  } else if (job === 'videoControl_website_switch') {
    logEvent({
      category: 'videoControlWebsiteSwitch',
      action: request.isEnable ? 'enable' : 'disable',
      label: '',
    });
    console.log(request);
    browser.tabs.query({}, tabs => {
      for (let i = 0; i < tabs.length; i++) {
        if (tabs[i].url.indexOf(request.host)) {
          browser.tabs.sendMessage(
            tabs[i].id,
            {
              job: 'videoControlContentScriptSwitch',
              enabled: request.isEnable,
            },
            () => {},
          );
        }
      }
    });
  } else if (job == 'handleImageTasks') {
    const {
      action,
      base64Array,
      savePath,
      concurrent,
      tabId,
      platform,
      filePath,
      provinceCheckedList,
    } = request; // DataURL
    if (action === 'startTasks') {
      startTasks(request);
    }

    sendResponse({ done: true });
  } else if (job == 'saveCanvasData') {
    console.log(request);
    const { dataUrl, filename, savePath, tabId } = request;
    captureBackgroundTabScreenshot(tabId, savePath, filename);

    // port.postMessage({
    //   action: 'download',
    //   url: dataUrl, // url或者base64
    //   filename: filename,
    //   save_path: savePath,
    // });
    // // tabsRemove(tabId);
    // taskCompleted(tabId);
    // sendResponse({
    //   done: true,
    // });
  } else if (job == 'getFullPath') {
    chrome.runtime.requestFileSystem(
      chrome.fileSystem.PERSISTENT,
      5 * 1024 * 1024,
      fs => {
        console.log('Initialized file system: ' + fs.name);
        // 选择一个文件
        chrome.fileSystem.chooseEntry({ type: 'openFile' }, function(entry) {
          if (!entry) {
            console.error('No file selected');
            return;
          }

          // 获取文件信息
          entry.file(
            function(file) {
              console.log('File name:', file.name);
              console.log('File size:', file.size);
              console.log('File type:', file.type);
              console.log('Last modified:', file.lastModified);

              // 读取文件内容
              const reader = new FileReader();
              reader.onload = function(e) {
                console.log('File content:', e.target.result);
              };
              reader.readAsText(file);
            },
            function(error) {
              console.error('Error getting file: ', error);
            },
          );
        });
      },
      function(error) {
        console.error('Error initializing file system: ', error);
      },
    );
  }
});

// 使用 chrome.debugger API，可支持在tab不激活状态下截图
function captureBackgroundTabScreenshot(tabId, savePath, filename) {
  // 连接到目标标签页
  chrome.debugger.attach(
    {
      tabId,
      // targetId: tabId
    },
    '1.3',
    () => {
      if (chrome.runtime.lastError) {
        console.error(
          'Debugger attach failed:',
          chrome.runtime.lastError.message,
        );
        return;
      }

      // 启用页面事件
      chrome.debugger.sendCommand({ tabId }, 'Page.enable', () => {
        if (chrome.runtime.lastError) {
          console.error(
            'Page.enable command failed:',
            chrome.runtime.lastError.message,
          );
          return;
        }

        try {
          // 捕获截图
          chrome.debugger.sendCommand(
            { tabId },
            'Page.captureScreenshot',
            {},
            result => {
              if (chrome.runtime.lastError) {
                console.error(
                  'Page.captureScreenshot command failed:',
                  chrome.runtime.lastError.message,
                );
                return;
              }

              // 处理截图数据
              const dataUrl = `data:image/png;base64,${result.data}`;
              // console.log('截图成功:', dataUrl);

              // 保存截图
              port.postMessage({
                action: 'download',
                url: dataUrl, // url或者base64
                filename: filename,
                save_path: savePath,
              });

              // 更新 localStorage 中的任务进度
              let currentProgress = parseInt(
                localStorage.getItem(taskStorePath),
                10,
              );
              currentProgress++;
              localStorage.setItem(taskStorePath, currentProgress);

              // 一个任务完成之后，随机读秒1-9，防止检测
              // 随机生成1到9秒之间的延迟
              const randomDelay = Math.floor(Math.random() * 9) + 1;
              console.log(`任务完成，随机延迟 ${randomDelay} 秒`);

              setTimeout(() => {
                taskCompleted(tabId);

                // 断开连接
                chrome.debugger.detach({ tabId }, () => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      'Debugger detach failed:',
                      chrome.runtime.lastError.message,
                    );
                  }
                });
              }, randomDelay * 1000);
            },
          );
        } catch (error) {
          console.error('Page.captureScreenshot command failed:', error);
        }
      });
    },
  );
}

async function startTasks(request) {
  const {
    action,
    // base64Array,
    savePath,
    concurrent,
    tabId,
    platform,
    filePath,
    provinceCheckedList,
    sliderValue,
    startDate,
    endDate,
  } = request; // DataURL

  const base64Array = await getDB(filePath);
  taskQueue = base64Array.map(item => ({
    ...item,
    savePath,
    platform,
    provinceCheckedList,
    sliderValue,
    startDate,
    endDate,
  }));
  activeTabs = new Map();

  await deleteDB(filePath);

  // 初始化 localStorage 中的任务进度
  taskStorePath = filePath;

  // 检查 localStorage 中是否存在相同的 taskStorePath 和任务进度
  const storedProgress = localStorage.getItem(taskStorePath);
  let initialProgress = 0;

  if (storedProgress) {
    initialProgress = parseInt(storedProgress, 10);
    console.log(`从进度 ${initialProgress} 开始`);
    taskQueue = taskQueue.slice(initialProgress); // 从该进度之后开始执行任务
  } else {
    console.log('从头开始');
    localStorage.setItem(taskStorePath, 0);
  }

  // 先绑定监听器
  const onTabUpdated = (tabId, changeInfo, tab) => {
    // console.log(`监听器触发：tabId=${tabId}, status=${changeInfo.status}`);
    if (changeInfo.status === 'complete' && processedTabs.has(tabId)) {
      if (tabId === tab.id) {
        const task = processedTabs.get(tabId);
        console.log(`标签页 ${tabId} 加载完成`);

        if (task) {
          chrome.tabs.sendMessage(
            tabId,
            {
              action: 'runAutomation',
              ...task,
              tabId: tabId,
            },
            {},
            () => {
              if (chrome.runtime.lastError) {
                console.error(
                  '发送runAutomation失败：',
                  chrome.runtime.lastError.message,
                );
              }
            },
          );
        }

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

        // 标记为已处理
        processedTabs.delete(tabId);
      }
      // 如果没有其他需要处理的标签页，移除监听器
      if (processedTabs.size === 0) {
        chrome.tabs.onUpdated.removeListener(onTabUpdated);
      }
    }
  };

  chrome.tabs.onUpdated.addListener(onTabUpdated);

  for (let i = 0; i < concurrent; i++) {
    const task = taskQueue.shift();
    createTabForTask(task);
  }
}

function processNextTask(tabId) {
  if (taskQueue.length === 0) {
    return; // 没有更多任务
  }

  const task = taskQueue.shift();

  // 找到一个空闲的标签页并发送任务
  activeTabs.set(tabId, { newTask: task });
  chrome.tabs.sendMessage(
    tabId,
    {
      action: 'runAutomation',
      ...task,
      tabId: tabId,
    },
    () => {
      console.log(`任务发送到标签页 ${tabId}`);
    },
  );
}

async function createTabForTask(task) {
  chrome.windows.create(
    {
      // url: 'http://localhost:8081/index.html#/image',
      url: 'https://www.baidu.com/',
      // url: task.platform == 'bsz' ? apiUrls.bszUrl : apiUrls.sszUrl,
      type: 'normal', // 可选，指定窗口类型，默认为 'normal'
      focused: true, // 可选，指定新窗口是否获得焦点
      state: 'maximized',
    },
    async newWindow => {
      if (chrome.runtime.lastError) {
        console.error(
          'Error creating window:',
          chrome.runtime.lastError.message,
        );
        return;
      }

      // 获取新窗口中的第一个标签页
      const [tab] = newWindow.tabs;

      console.log(`创建新窗口，标签页ID：${tab.id}`);
      activeTabs.set(tab.id, { newTask: task });

      // 记录需要处理的标签页
      processedTabs.set(tab.id, task);
    },
  );
}

// 创建打开新标签页
// async function createTabForTask(task) {
//   chrome.tabs.create(
//     {
//       url: 'http://localhost:8081/index.html#/image',
//       // url: apiUrls.bszUrl
//     },
//     async tab => {
//       if (chrome.runtime.lastError) {
//         console.error('Error creating tab:', chrome.runtime.lastError.message);
//         return;
//       }
//       console.log(`创建标签页：${tab.id}`);
//       activeTabs.set(tab.id, { newTask: task });

//       // 记录需要处理的标签页
//       processedTabs.set(tab.id, task);
//     },
//   );
// }

// 一个任务完成之后
function taskCompleted(tabId) {
  if (activeTabs.has(tabId)) {
    activeTabs.set(tabId, { newTask: null });
  }

  if (taskQueue.length === 0) {
    console.log('所有任务已完成，清楚localstorage');
    localStorage.removeItem(taskStorePath);
  }
  processNextTask(tabId); // 处理下一个任务
}

document.addEventListener('DOMContentLoaded', async () => {
  await options.init();
  await image.init();
});
