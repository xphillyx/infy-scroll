/**
 * Infy Scroll
 * @file background.js
 * @author Roy Six
 * @license TBD
 */

/**
 * Background handles all extension-specific background tasks, such as installation and update events, listeners, and
 * supporting chrome.* apis that are only available in the background (such as commands or setting the toolbar icon).
 *
 * Since the extension is designed to primarily be a content-script based extension, and because this extension does not
 * have a persistent background, there is little logic contained here, and there is no "state" (objects in memory).
 */
var Background = (() => {

  // The storage default values. Note: Storage.set can only set top-level JSON objects, avoid using nested JSON objects (instead, prefix keys that should be grouped together with a label e.g. "auto")
  const STORAGE_DEFAULT_VALUES = {
    "installVersion": chrome.runtime.getManifest().version, "installDate": new Date().toJSON(), "firstRun": true, "on": true,
    "toolbarIcon": "dark", "buttonSize": 50, "interfaceImage": "infy", "interfaceMessages": true,
    "customScriptsEnabled": true, "resizeMediaEnabled": true, "decodeURIEnabled": false, "debugEnabled": false,
    "interval": 1, "leadingZerosPadByDetection": true, "shuffleLimit": 100, "shuffleStart": false,
    "base": 10, "baseCase": "lowercase", "baseDateFormat": "yyyy/mm/dd", "baseRoman": "latin", "baseCustom": "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    "selectionPriority": "smart", "selectionCustom": { "url": "", "regex": "", "flags": "", "group": 0, "index": 0 },
    "errorSkip": 0, "errorCodes": ["404", "3XX"], "errorCodesCustom": [],
    "nextType": "selector", "nextSelector": "[rel=\"next\"]", "nextXpath": "//*[@rel=\"next\"]", "nextAttribute": ["href"],
    "prevType": "selector", "prevSelector": "[rel=\"prev\"],[rel=\"previous\"]", "prevXpath": "//*[@rel=\"prev\"]|//*[@rel=\"previous\"]", "prevAttribute": ["href"],
    "nextKeywords": ["pnnext", "nextpage", "next-page", "next_page", "next>", "next»", "next→", "next", "moreresults", "olderposts", "olderpost", "older", "forward", "下一页", "次のページ", "次", "&gt;", ">", "›", "→", "»"],
    "prevKeywords": ["pnprev", "previouspage", "prevpage", "prev-page", "prev_page", "<prev", "«prev", "←prev", "prev", "previous", "newerposts", "newerpost", "newer", "上一页", "前のページ", "前", "&lt;", "<", "‹", "←", "«"],
    "buttonType": "selector", "buttonRule": "#load-more-button", "buttonMethod": "click", "buttonScrollPixels": 1000,
    "autoTimes": 10, "autoSeconds": 2, "autoBadge": "times", "autoSlideshow": false, "autoBehavior": "smooth", "autoStart": false,
    "scrollAction": "next", "scrollAppend": "page", "scrollElementRule": "body > *", "scrollElementInsertRule": "", "scrollElementType": "selector", "scrollMediaType": "image",
    "scrollDetection": "sl", "scrollDetectionThrottle": 200, "scrollBehavior": "auto", "scrollUpdateAddress": true, "scrollUpdateTitle": true,
    "scrollAppendThresholdPages": 0, "scrollAppendThresholdPixels": 500, "scrollAppendDelay": 2000, "scrollAppendScripts": false, "scrollAppendStyles": false, "scrollDivider": "element", "scrollDividerAlign": "center", "scrollOverlay": false, "scrollIcon": true, "scrollLoading": true,
    "saves": [], "whitelist": [], "whitelistEnabled": false, "database": [], "databaseDate": null, "databaseAutoActivate": true, "databaseAutoUpdate": 1, "databaseBlacklist": [], "databaseWhitelist": []
  };

  // The browser action badges that will be displayed against the extension icon
  const BROWSER_ACTION_BADGES = {
    "incrementm": { "text": "+",    "backgroundColor": "#4AACED" },
    "decrementm": { "text": "-",    "backgroundColor": "#4AACED" },
    "increment":  { "text": "+",    "backgroundColor": "#1779BA" },
    "decrement":  { "text": "-",    "backgroundColor": "#1779BA" },
    "next":       { "text": ">",    "backgroundColor": "#05854D" },
    "prev":       { "text": "<",    "backgroundColor": "#05854D" },
    "button":     { "text": "BTN",  "backgroundColor": "#8073AE" },
    "list":       { "text": "LIST", "backgroundColor": "#8073AE" },
    "return":     { "text": "RET",  "backgroundColor": "#FFCC22" },
    "auto":       { "text": "AUTO", "backgroundColor": "#FF6600" },
    "autotimes":  { "text": "",     "backgroundColor": "#FF6600" },
    "autopause":  { "text": "❚❚",    "backgroundColor": "#FF6600" },
    "autorepeat": { "text": "REP",  "backgroundColor": "#FF6600" },
    "skip":       { "text": "SKIP", "backgroundColor": "#000000" },
    "on":         { "text": "ON",   "backgroundColor": "#6200ee" },
    "off":        { "text": "OFF",  "backgroundColor": "#E6003E" },
    "default":    { "text": "",     "backgroundColor": [0,0,0,0] }
  };

  /**
   * Sets the browser action badge for this tabId. Can either be temporary or for an indefinite time.
   * Note that when the tab is updated, the browser removes the badge.
   *
   * @param tabId           the tab ID to set this badge for
   * @param badge           the badge key to set from BROWSER_ACTION_BADGES
   * @param temporary       boolean indicating whether the badge should be displayed temporarily (true) or not (false)
   * @param text            (optional) the text to use instead of the the badge text
   * @param backgroundColor (optional) the backgroundColor to use instead of the badge backgroundColor
   * @private
   */
  function setBadge(tabId, badge, temporary, text, backgroundColor) {
    console.log("setBadge() - tabId=" + tabId + ", badge=" + badge + ", temporary=" + temporary + ", text=" + text + ", backgroundColor=" + backgroundColor);
    // Firefox Android: chrome.browserAction.setBadge* not supported
    if (!chrome.browserAction.setBadgeText || !chrome.browserAction.setBadgeBackgroundColor) {
      console.log("setBadge() - no chrome.browserAction badge functions are available, returning");
      return;
    }
    // Must have either a badge object or both a text and backgroundColor to continue
    if (!BROWSER_ACTION_BADGES[badge] && (!text || !backgroundColor)) {
      console.log("setBadge() - no badge and either no text or backgroundColor detected, returning");
      return;
    }
    chrome.browserAction.setBadgeText({text: text || BROWSER_ACTION_BADGES[badge].text, tabId: tabId});
    chrome.browserAction.setBadgeBackgroundColor({color: backgroundColor || BROWSER_ACTION_BADGES[badge].backgroundColor, tabId: tabId});
    if (temporary) {
      setTimeout(function () {
        // If this is a off, revert to default, otherwise assume we're still on
        const revert = badge === "off" ? "default": "on";
        chrome.browserAction.setBadgeText({text: BROWSER_ACTION_BADGES[revert].text, tabId: tabId});
        chrome.browserAction.setBadgeBackgroundColor({color: BROWSER_ACTION_BADGES[revert].backgroundColor, tabId: tabId});
      }, 2000);
    }
  }

  /**
   * Downloads the database.
   *
   * Note: This function is in the Background because both the Options and Content Script need the ability to download
   * the database. If it weren't in the Background, we would need to duplicate this function in both places.
   *
   * @param options the download options (for example, if this should fallback to use a backup url)
   * @returns {Promise<{error: *, downloaded: boolean}>}
   * @private
   */
  async function downloadDatabase(options) {
    const result = { downloaded: false, error: undefined };
    let url = "";
    try {
      // Save the Database Date first (separately) to avoid potential issues, such as this function being called on every request in case of error with the fetch request
      await Promisify.setItems({"databaseDate": new Date().toJSON()});
      url = chrome.i18n.getMessage("database_url" + (options && options.useBackup && options.previousException ? "_backup" : ""));
      console.log("Downloading database from: " + url);
      const response = await fetch(url);
      let database = await response.json();
      // Filter the database to only records who contain the required properties
      database = database.filter(d => d.data && d.data.url && d.data.nextLink && d.data.pageElement);
      // Map the database records (r) to just the 3 or 4 required components in each record's data: url, nextLink, pageElement, insertBefore (optional)
      database = database.map(d => { const r = { "url": d.data.url, "nextLink": d.data.nextLink, "pageElement": d.data.pageElement }; if (d.data.insertBefore) { r.insertBefore = d.data.insertBefore; } return r; });
      // Sort the database with the longest URLs first to find the most exact URL match first
      database.sort((a, b) => (a.url.length < b.url.length) ? 1 : -1);
      if (database.length > 0) {
        await Promisify.setItems({"database": database});
        result.downloaded = true;
      } else {
        throw "Database length is 0";
      }
    } catch (e) {
      console.log("Error downloading database from: " + url + " - error=" + e);
      result.error = e;
      if (options && options.useBackup && !options.previousException) {
        options.previousException = true;
        return await downloadDatabase(options);
      }
    }
    console.log("result.downloaded=" + result.downloaded + ", result.error=" + result.error);
    return result;
  }

  /**
   * Listen for installation changes and do storage/extension initialization work.
   *
   * @param details the installation details
   * @private
   */
  async function installedListener(details) {
    console.log("installedListener() - details=" + JSON.stringify(details));
    // Install:
    if (details.reason === "install") {
      console.log("installedListener() - installing...");
      await Promisify.clearItems();
      await Promisify.setItems(STORAGE_DEFAULT_VALUES);
      chrome.runtime.openOptionsPage();
    }
    // Update:
    else if (details.reason === "update") {
      // 0.2 Update: Add new options, force re-download database (if applicable), re-sort saves by ID to remove previously bad id duplicate id generation
      if (details.previousVersion < "0.2") {
        console.log("installedListener() - updating to 0.2...");
        const items = await Promisify.getItems();
        const shouldDownloadDatabase = items && items.database && items.database.length > 0;
        await Promisify.setItems({
          "interfaceMessages": true,
          "whitelistEnabled": items && items.whitelist && items.whitelist.length > 0,
          "database": [],
          "databaseDate": null,
          "databaseAutoUpdate": 1,
          "databaseBlacklist": items && items.databaseExclusions ? items.databaseExclusions : [],
          "databaseWhitelist": []
        });
        await Promisify.removeItems("databaseExclusions");
        let saves = items && items.saves && items.saves.length > 0 ? items.saves : [];
        // Ensure each save has a url and type (there was no validation on this in 0.1)
        saves = saves.filter(save => save.url && save.type);
        // Re-generate IDs in case there is now a gap after filtering, e.g. if deleting ID 3 in this array: [1, 2, 4, 5, ...]
        saves.sort((a, b) => (a.order > b.order) ? 1 : (a.order === b.order) ? ((a.url && b.url && a.url.length < b.url.length) ? 1 : -1) : -1);
        for (let i = 0; i < saves.length; i++) {
          // Set new id and new properties: title and scrollElementInsertRule added in 0.2
          if (saves[i]) {
            saves[i].id = i + 1;
            saves[i].title = "";
            saves[i].scrollElementInsertRule = "";
          }
        }
        // Resort back to default sort order
        saves.sort((a, b) => (a.order > b.order) ? 1 : (a.order === b.order) ? ((a.url && b.url && a.url.length < b.url.length) ? 1 : -1) : -1);
        await Promisify.setItems({"saves": saves});
        // Force re-download database if the user already had a prior database because 0.1's database is stored in a different format in 0.2+
        if (shouldDownloadDatabase) {
          await downloadDatabase({useBackup: true});
        }
      }
      // 0.3 Update: Reset scroll options to better default values to avoid too many requests, change percentage thresholds to pixels thresholds, add new scripts and styles options
      if (details.previousVersion < "0.3") {
        console.log("installedListener() - updating to 0.3...");
        const items = await Promisify.getItems();
        // Set new storage items and reset default values for some items
        await Promisify.setItems({
          "customScriptsEnabled": STORAGE_DEFAULT_VALUES.customScriptsEnabled,
          "scrollAppendThresholdPages": items && items.scrollDetection === "io" ? 1 : 0,
          "scrollAppendThresholdPixels": STORAGE_DEFAULT_VALUES.scrollAppendThresholdPixels,
          "scrollAppendDelay": STORAGE_DEFAULT_VALUES.scrollAppendDelay,
          "scrollAppendScripts": STORAGE_DEFAULT_VALUES.scrollAppendScripts,
          "scrollAppendStyles": STORAGE_DEFAULT_VALUES.scrollAppendStyles,
          "buttonScrollPixels": STORAGE_DEFAULT_VALUES.buttonScrollPixels
        });
        // Remove unused storage items
        await Promisify.removeItems(["script", "scriptStart", "buttonScrollPercentage", "scrollAppendThresholdPercentage"]);
        // Add new properties introduced in 0.3 and remove unused properties to each save object
        const saves = items && items.saves && items.saves.length > 0 ? items.saves : [];
        for (const save of saves) {
          save.scrollAppendScripts = STORAGE_DEFAULT_VALUES.scrollAppendScripts;
          save.scrollAppendStyles = STORAGE_DEFAULT_VALUES.scrollAppendStyles;
          save.buttonScrollPixels = STORAGE_DEFAULT_VALUES.buttonScrollPixels;
          save.nextKeywordsEnabled = true;
          save.prevKeywordsEnabled = true;
          delete save.buttonScrollPercentage;
        }
        await Promisify.setItems({"saves": saves});
      }
      // 0.4 Update: Scroll Append Threshold pixels/pages changes. Also changed Append Element selector rule to target the children of the parent element, not the parent (this affects append element selector saves)
      if (details.previousVersion < "0.4") {
        console.log("installedListener() - updating to 0.4...");
        const items = await Promisify.getItems();
        // Reset default values for scroll append threshold due to internal algorithm change and new minimum values being 0, not -1
        // Reset scrollElementInsertRule due to selector rule change, add new autoBehavior and on storage items
        await Promisify.setItems({
          "scrollAppendThresholdPages": STORAGE_DEFAULT_VALUES.scrollAppendThresholdPages,
          "scrollAppendThresholdPixels": STORAGE_DEFAULT_VALUES.scrollAppendThresholdPixels,
          "scrollElementRule": STORAGE_DEFAULT_VALUES.scrollElementRule,
          "autoBehavior": STORAGE_DEFAULT_VALUES.autoBehavior,
          "on": STORAGE_DEFAULT_VALUES.on
        });
        // Remove the scrollbar detection option; this option is pretty much irrelevant in scroll listener mode as scroll pixels will always append pages until a scrollbar exists anyway
        await Promisify.removeItems("scrollbarDetect");
        // Fix saves that use Append Element mode with selector rule type to point to the child elements (not the parent element)
        const saves = items && items.saves && items.saves.length > 0 ? items.saves : [];
        for (const save of saves) {
          if (save && save.scrollAppend === "element" && save.scrollElementType === "selector" && save.scrollElementRule && save.scrollElementRule.length > 0) {
            save.scrollElementRule += " > *";
          }
        }
        await Promisify.setItems({"saves": saves});
      }
      // 0.5 Update: Two new options for scroll divider alignment and scroll icon
      if (details.previousVersion < "0.5") {
        console.log("installedListener() - updating to 0.4...");
        const items = await Promisify.getItems();
        // Add new storage items for two options
        await Promisify.setItems({
          "scrollDividerAlign": STORAGE_DEFAULT_VALUES.scrollDividerAlign,
          "scrollIcon": STORAGE_DEFAULT_VALUES.scrollIcon
        });
      }
    }
    startupListener();
  }

  /**
   * The extension's background startup listener that is run the first time the extension starts.
   * For example, when Chrome is started, when the extension is installed or updated, or when the
   * extension is re-enabled after being disabled.
   *
   * @private
   */
  async function startupListener() {
    console.log("startupListener()");
    const items = await Promisify.getItems();
    // Ensure the chosen toolbar icon is set. Firefox Android: chrome.browserAction.setIcon() not supported
    if (chrome.browserAction.setIcon && items && ["dark", "light"].includes(items.toolbarIcon)) {
      console.log("startupListener() - setting browserAction icon to " + items.toolbarIcon);
      chrome.browserAction.setIcon({
        path : {
          "16": "/img/icon-" + items.toolbarIcon + ".png",
          "24": "/img/icon-" + items.toolbarIcon + ".png",
          "32": "/img/icon-" + items.toolbarIcon + ".png"
        }
      });
    }
    // Firefox: Set badge text color to white always instead of using default color-contrasting introduced in FF 63
    if (typeof browser !== "undefined" && browser.browserAction && browser.browserAction.setBadgeTextColor) {
      browser.browserAction.setBadgeTextColor({color: "white"});
    }
  }

  /**
   * Listen for requests from chrome.runtime.sendMessage (e.g. Content Scripts). Note: sender contains tab
   *
   * @param request      the request containing properties to parse (e.g. greeting message)
   * @param sender       the sender who sent this message, with an identifying tab
   * @param sendResponse the optional callback function (e.g. for a reply back to the sender)
   * @private
   */
  async function messageListener(request, sender, sendResponse) {
    console.log("messageListener() - request=" + (request ? JSON.stringify(request) : "undefined"));
    // TODO: This isn't actually needed anymore because we don't ever use the sender.tab.url (this was a carryover from URLI); however keeping it commented out for reference in the future
    // Firefox: sender.tab.url is undefined in FF due to not having tabs permissions (even though we have <all_urls>!), so use sender.url, which should be identical in 99% of cases (e.g. iframes may be different)
    // if (sender && sender.url && sender.tab && !sender.tab.url) {
    // sender.tab.url = sender.url;
    // }
    // Default response
    let response = {};
    switch (request.greeting) {
      case "setBadge":
        setBadge(request.tabId ? request.tabId : sender.tab.id, request.badge, request.temporary, request.text, request.backgroundColor);
        break;
      case "getSDV":
        response = STORAGE_DEFAULT_VALUES;
        break;
      case "downloadDatabase":
        response = await downloadDatabase(request.options);
        break;
      case "turnOff":
        const tabs = await Promisify.getTabs({});
        if (tabs) {
          for (const tab of tabs) {
            if (tab && tab.id) {
              console.log("messageListener() - sending a stop message to tab.id=" + tab.id);
              Promisify.tabsSendMessage(tab.id, {greeting: "stop", caller: "background"});
            }
          }
        }
        break;
      default:
        break;
    }
    sendResponse(response);
  }

  /**
   * Listen for commands (Browser Extension shortcuts) and perform the command's action.
   *
   * @param command the shortcut command that was performed
   * @private
   */
  async function commandListener(command) {
    console.log("commandListener() - command=" + command);
    if (command === "down" || command === "up" || command === "off" || command === "auto")  {
      const tabs = await Promisify.getTabs();
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {greeting: "command", caller: "command", action: command});
      }
    }
  }

  // Background Listeners
  chrome.runtime.onInstalled.addListener(installedListener);
  chrome.runtime.onStartup.addListener(startupListener);
  // Message Listener: We need to return immediately if the function will be performing asynchronous work
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { messageListener(request, sender, sendResponse); if (request && request.async) { return true; } });
  // Firefox Android: chrome.commands is unsupported
  if (chrome.commands) { chrome.commands.onCommand.addListener(commandListener); }

})();