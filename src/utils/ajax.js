import fetch from 'dva/fetch';
import {
  getCurrentTab,
  sendMessage,
  getCurrentCookies,
} from 'SRC/utils/browserUtils';

const parseResponse = response => {
  if (response.headers.get('Content-Type').indexOf('text/html') !== -1) {
    return response.text();
  } else {
    return response.json();
  }
};

const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }

  const error = new Error(response.statusText);
  error.response = response;
  throw error;
};

/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
export default async (url, options) => {
  return fetch(url, options)
    .then(checkStatus)
    .then(parseResponse)
    .then(data => ({ data }))
    .catch(err => ({ err }));
};
