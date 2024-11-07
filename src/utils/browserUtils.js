export const sendMessage = content => {
  return new Promise(resolve => {
    browser.runtime.sendMessage(content, response => {
      resolve(response);
    });
  });
};

export const sendTabMessage = (tabId, content) => {
  return new Promise(resolve => {
    browser.tabs.sendMessage(
      tabId,
      {
        ...content,
      },
      () => {
        resolve();
      },
    );
  });
};
export const getCurrentTab = () => {
  return new Promise(resolve => {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      if (tabs[0]) {
        resolve(tabs[0]);
      } else {
        resolve(null);
      }
    });
  });
};

export const getCurrentCookies = (url) => {
  return new Promise(resolve => {
    browser.tabs.query({ active: true, lastFocusedWindow: true }, tabs => {
      const activeTabUrl = url ? url : tabs[0] ? tabs[0].url : ''
      if (activeTabUrl) {
        const url = new URL(activeTabUrl);
        const domain = url.hostname;
        const path = url.pathname;

        // 获取指定域和路径的Cookie
        chrome.cookies.getAll({ url: activeTabUrl }, cookies => {
          // 将Cookie对象转换为字符串
          const cookieString = cookies
            .map(cookie => `${cookie.name}=${cookie.value}`)
            .join('; ');

          let info = {};
          cookies.forEach(elem => {
            let key = elem.name;
            let value = elem.value;
            if (!info.hasOwnProperty(key)) {
              info[key] = value;
            }
          });
          console.log(info);
          resolve(info);
        });
      } else {
        resolve(null);
      }
    });
  });
};

export const generateNewTabUrl = path => {
  return new Promise(resolve => {
    let url = browser.runtime.getURL(path);
    resolve(url);
  });
};

export const createNewTab = options => {
  return new Promise(resolve => {
    browser.tabs.create(options, async tab => {
      browser.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === 'complete' && tabId === tab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
        return true
      });
    });
  });
};
