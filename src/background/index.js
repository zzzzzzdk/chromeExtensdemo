import userBrowser from '../utils/useBrowser';
import AutoRefresh from './AutoRefresh';
import Image from './Image';
import Options from './Options';
import {
  getCurrentTab,
  sendMessage,
  sendTabMessage,
} from 'SRC/utils/browserUtils';
import { getDB, set } from '../utils/db';
import { wait } from '../utils';
import { logEvent } from '../utils/bello';
// import {
//   connect,
//   ExtensionTransport,
// } from '../utils/puppeteer-core/lib/esm/puppeteer/puppeteer-core-browser.js';
// import { WebContainer } from '@webcontainer/api';
// Call only once
userBrowser();

const autoRefresh = new AutoRefresh();
const image = new Image();
const options = new Options();

let lastVideoControl = 0;

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
  } else if (job == 'handleSearch') {
    // // const { tabId } = request;
    // console.log(sender.tab.id)
    // // const tabId =  await getCurrentTab()
    // chrome.tabs.executeScript({
    //   target: { tabId: sender.tab.id, allFrames: true },
    //   code: `console.log('location:', window.location.href);`,
    // }, () => console.log("script injected in all frames"))
    // sendResponse(request);

    // });

    try {
      // chrome.debugger.onEvent.addListener((source, method, params) => {
      //   console.log(source);
      // });
      // Create a tab or find a tab to attach to.
    } catch (error) {
      console.error('Error running Puppeteer:', error);
    }
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await options.init();
  await image.init();
});

// chrome.runtime.onInstalled.addListener(() => {
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     if (tabs.length > 0) {
//       const tabId = tabs[0].id;
//       chrome.debugger.attach({ tabId }, '1.3', () => {
//         if (chrome.runtime.lastError) {
//           console.error(
//             'Debugger attach failed:',
//             chrome.runtime.lastError.message,
//           );
//           return;
//         }

//         chrome.debugger.sendCommand({ tabId }, 'Page.enable', () => {
//           if (chrome.runtime.lastError) {
//             console.error(
//               'Page.enable command failed:',
//               chrome.runtime.lastError.message,
//             );
//             return;
//           }

//           chrome.debugger.sendCommand(
//             { tabId },
//             'Page.navigate',
//             { url: 'https://example.com' },
//             () => {
//               if (chrome.runtime.lastError) {
//                 console.error(
//                   'Page.navigate command failed:',
//                   chrome.runtime.lastError.message,
//                 );
//                 return;
//               }

//               chrome.debugger.sendCommand(
//                 { tabId },
//                 'Page.loadEventFired',
//                 () => {
//                   if (chrome.runtime.lastError) {
//                     console.error(
//                       'Page.loadEventFired command failed:',
//                       chrome.runtime.lastError.message,
//                     );
//                     return;
//                   }

//                   chrome.debugger.detach({ tabId }, () => {
//                     if (chrome.runtime.lastError) {
//                       console.error(
//                         'Debugger detach failed:',
//                         chrome.runtime.lastError.message,
//                       );
//                     }
//                   });
//                 },
//               );
//             },
//           );
//         });
//       });
//     }
//   });
// });
