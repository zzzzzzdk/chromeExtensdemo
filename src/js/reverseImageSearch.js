import { get, set, setDB, getDB } from 'SRC/utils/db.js';
import ajax from 'SRC/utils/ajax.js';
import ENGINE_DONE from 'SRC/constant/constants.js';
import { ENGINE_WEIGHTS } from '../constant/constants';
import { parseGoogleImageLink } from 'SRC/utils/imageUtils';
import { apiUrls } from 'SRC/constant/searchApiUrl.js';
import {
  getCurrentTab,
  sendMessage,
  getCurrentCookies,
  createNewTab,
  generateNewTabUrl,
} from 'SRC/utils/browserUtils';

const HTML = new DOMParser();
// Data Format
export const reverseImageSearch = {
  updateResultImage: (result, cursor) => {
    browser.runtime.sendMessage(
      {
        job: 'image_result_update',
        result: result,
        cursor: cursor,
      },
      response => {
        // console.log("Send Search Result");
        if (browser.runtime.lastError) {
          const errorMessage = browser.runtime.lastError.message;
          console.log('image_result_update出错：', errorMessage);
        } else {
        }
      },
    );
  },
  updateImage64: (base64, cursor) => {
    browser.runtime.sendMessage(
      {
        job: 'image_base64',
        result: base64,
        cursor: cursor,
      },
      () => {
        // console.log("Send base 64 Message");
      },
    );
  },
  updateImageUrl: (url, cursor) => {
    browser.runtime.sendMessage(
      {
        job: 'image_url',
        result: url,
        cursor: cursor,
      },
      () => {},
    );
  },
  reportError: cursor => {},
  waitForSandBox: parseObj => {
    return new Promise(function(resolve, reject) {
      //移除 listener
      let remove = function() {
        window.removeEventListener('message', trigger);
      };
      //触发Resolve
      let trigger = function(event) {
        // console.log(this)
        // console.log(remove);
        remove();
        resolve(event.data);
      };
      //添加Listener
      window.addEventListener('message', trigger);
      //把数据发送Sandbox
      document
        .getElementById('theFrame')
        .contentWindow.postMessage(parseObj, '*');
    });
  },
  fetchYituLink: async (link, cursor, resultObj) => {
    const cookies = await getCurrentCookies(link);
    try {
      // debugger
      // let oldResult = await getDB(cursor);
      // console.log(oldResult)

      let imgData = [];
      // 图片url或者base64需要先请求图片识别特征值、
      if (resultObj.base64Flag) {
        const formData = new FormData();
        formData.append('img_data', resultObj.base64);
        const { data, err } = await ajax(apiUrls.analysisImageClipping, {
          method: 'POST',
          headers: {
            Authorization: cookies ? cookies.YSTOKEN : '',
          },
          mode: 'cors',
          body: formData,
        });
        if (err) {
          alert(`识别接口失败: ${err}`);
          throw err;
        }
        // 检查data是否为数组且不为空
        if (!$.isArray(data.data) || !data.data.length) {
          alert('未识别目标');
          return;
        }

        // 取data的第一个元素作为imgData
        imgData = [data.data[0]];
      } else {
        const formData = new FormData();
        formData.append('imageUrl', resultObj.url);
        formData.append('analysisType', 'full');
        const { data, err } = await ajax(apiUrls.analysisImage, {
          method: 'POST',
          headers: {
            Authorization: cookies ? cookies.YSTOKEN : '',
          },
          mode: 'cors',
          body: formData,
        });
        if (err) {
          alert(`识别接口失败: ${err}`);
          throw err;
        }

        if (!$.isArray(data.data) || !data.data.length) {
          alert('未识别目标');
          return;
        }

        imgData = [data.data[0]];
      }

      const { data, err } = await ajax(link, {
        method: 'POST',
        headers: {
          Authorization: cookies ? cookies.YSTOKEN : '',
        },
        body: JSON.stringify({
          featureList: imgData,
          fileId: [],
          groupFilters: [],
          imageType: 'image',
          locationIds: [],
          pageNo: 1,
          pageSize: 40,
          qualityFilter: 1,
          similarity: 80,
          sort: { field: 'similarity', order: 'desc' },
          timeRange: {
            times: [
              dayjs()
                .subtract(6, 'days')
                .startOf('day')
                .format('YYYY-MM-DD HH:mm:ss'),
              dayjs().format('YYYY-MM-DD HH:mm:ss'),
            ],
          },
        }),
      });
      if (err) {
        alert(err);
        throw err;
      }

      const sameResult = reverseImageSearch.processYituData(data.data);
      console.log(sameResult);
      resultObj.searchResult = (oldResult ? oldResult : []).concat(sameResult);
      resultObj['yituDone'] = true;
      await setDB(cursor, resultObj);
      reverseImageSearch.updateResultImage(resultObj, cursor);
    } catch (e) {
      console.error(e);
      resultObj['yituDone'] = true;
      reverseImageSearch.updateResultImage(resultObj, cursor);
    }
  },
  processYituData: imgArray => {
    const results = [];
    for (let i = 0; i < imgArray.length; i++) {
      const singleResult = {
        targetImage: '',
        bigImage: '',
        similarity: '',
        targetType: '',
      };

      singleResult.targetImage = imgArray[i].targetImage || '';
      singleResult.bigImage = imgArray[i].bigImage || '';
      singleResult.similarity = imgArray[i].similarity || '';
      singleResult.targetType = imgArray[i].targetType || '';

      results[results.length] = singleResult;
    }
    return results;
  },
};
