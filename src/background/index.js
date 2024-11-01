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
userBrowser();

const autoRefresh = new AutoRefresh();
const image = new Image();
const options = new Options();

let lastVideoControl = 0;

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
    const { base64 } = request;
    image.beginImageSearch(base64);
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
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await options.init();
  await image.init();
});
