/**
 * Infy Scroll
 * @file promisify.js
 * @author Roy Six
 * @license TBD
 */

/**
 * Promisify contains promise-based wrappers for common extension tasks, like getting storage items, getting tabs, and
 * sending messages between different parts of the extension.
 *
 * Because the chrome.* api uses callbacks, this is a convenience object that allows the extension to use async/await
 * and be coded in a simpler fashion.
 */
var Promisify = (() => {

  /**
   * Gets the storage items via a promise-based wrapper for async/await callers.
   *
   * @param key       (optional) the storage item key to get or null for all items
   * @param namespace (optional) the storage namespace, either "local" or "sync"
   * @returns {Promise<{}>} the storage items
   * @public
   */
  function getItems(key = null, namespace = "local") {
    return new Promise(resolve => {
      chrome.storage[namespace].get(key, items => {
        key ? resolve(items[key]) : resolve(items);
      });
    });
  }

  /**
   * Sets the storage items via a promise-based wrapper for async/await callers.
   *
   * @param items     the storage items (object {}) to set
   * @param namespace (optional) the storage namespace, either "local" or "sync"
   * @returns {Promise<{}>}
   * @public
   */
  function setItems(items, namespace = "local") {
    return new Promise(resolve => {
      chrome.storage[namespace].set(items, resolve);
    });
  }

  /**
   * Removes a storage item via a promise-based wrapper for async/await callers.
   * Example: chrome.storage.local.remove("myStorageItemToRemove");
   *
   * @param items     the storage items to remove, this can either be a String for one value or Array [] for multiple
   * @param namespace (optional) the storage namespace, either "local" or "sync"
   * @returns {Promise<{}>}
   * @public
   */
  function removeItems(items, namespace = "local") {
    return new Promise(resolve => {
      chrome.storage[namespace].remove(items, resolve);
    });
  }

  /**
   * Clears the storage items via a promise-based wrapper for async/await callers.
   *
   * @param namespace (optional) the storage namespace, either "local" or "sync"
   * @returns {Promise<{}>}
   * @public
   */
  function clearItems(namespace = "local") {
    return new Promise(resolve => {
      chrome.storage[namespace].clear(resolve);
    });
  }

  /**
   * Gets the queried tabs via a promise-based wrapper for async/await callers.
   *
   * @param queryInfo (optional) the query object to use
   * @returns {Promise<{}>} the tabs
   * @public
   */
  function getTabs(queryInfo = {active: true, lastFocusedWindow: true}) {
    return new Promise(resolve => {
      chrome.tabs.query(queryInfo, tabs => {
        resolve(tabs);
      });
    });
  }

  /**
   * Sends a message to the extension's runtime (background) via a promise-based wrapper for async/await callers.
   *
   * @param message the message object e.g. {greeting: "doSomething"}
   * @returns {Promise<{}>} the response
   * @public
   */
  function runtimeSendMessage(message) {
    return new Promise(resolve => {
      message.async = true;
      chrome.runtime.sendMessage(message, response => {
        resolve(response);
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
        }
      });
    });
  }

  /**
   * Sends a message to a tab's content script via a promise-based wrapper for async/await callers.
   *
   * @param tabId   the content script's tab ID to send the message to
   * @param message the message object e.g. {greeting: "doSomething"}
   * @returns {Promise<{}>} the response
   * @public
   */
  function tabsSendMessage(tabId, message) {
    return new Promise(resolve => {
      message.async = true;
      chrome.tabs.sendMessage(tabId, message, response => {
        resolve(response);
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
        }
      });
    });
  }

  /**
   * Executes a content script on a given tab via a promise-based wrapper for async/await callers.
   *
   * Important: This should be the only chrome.* api function that handles a reject in the promise.
   *
   * @param tabId   the content script's tab ID to send the message to
   * @param details the details object e.g. {file: "my-content-script.js"}
   * @returns {Promise<{}>} the response
   * @public
   */
  function tabsExecuteScript(tabId, details) {
    return new Promise((resolve, reject) => {
      chrome.tabs.executeScript(tabId, details, response => {
        if (chrome.runtime.lastError) {
          console.log(chrome.runtime.lastError.message);
          reject(chrome.runtime.lastError.message);
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Makes an XMLHttpRequest to a URL and returns its document via a promise-based wrapper for async/await callers.
   *
   * @param url          the url to make the request to
   * @param method       the HTTP request method, e.g. "GET"
   * @param responseType the request's response type, e.g. "document" ("text" is the default if not specified in XHR)
   * @returns {Promise<>} the response
   * @public
   */
  function xhr(url, method = "GET", responseType = "document") {
    console.log("xhr() - method=" + method + ", responseType=" + responseType + ", url=" + url);
    return new Promise((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open(method, url);
      request.responseType = responseType;
      request.onload = function(event) {
        console.log("xhr() onload() - request.response=" + request.response);
        resolve(request.response);
      };
      request.onerror = function() {
        console.log("xhr() onerror() - request=" + request);
        reject("xhr() onerror() - promise rejected");
      };
      request.send();
    });
  }

  // Return Public Functions
  return {
    getItems: getItems,
    setItems: setItems,
    removeItems: removeItems,
    clearItems: clearItems,
    getTabs: getTabs,
    runtimeSendMessage: runtimeSendMessage,
    tabsSendMessage: tabsSendMessage,
    tabsExecuteScript: tabsExecuteScript,
    xhr: xhr
  };

})();