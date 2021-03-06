/**
 * Infy Scroll
 * @file next-prev.js
 * @author Roy Six
 * @license TBD
 */

/**
 * NextPrev handles all next and prev link logic, mainly finding the next or prev link on the page.
 *
 * The algorithm performs the following steps:
 * 1. Rule - Using a CSS Selector or XPath rule to find the link directly
 * 2. Keywords - Parsing the page for links that contain common next or prev keywords
 */
var NextPrev = (() => {

  /**
   * Finds the next or prev URL based on the CSS Selector or XPath rule. Falls back to parsing the page using common
   * next or prev keywords.
   *
   * TODO: Parse iframes (and older frames and framesets?) nested inside the document
   *
   * @param type             the rule type can be "selector" or "xpath"
   * @param selector         the next or prev css selector rule to use
   * @param xpath            the next or prev xpath rule to use
   * @param attribute        the array of next or prev css selector/xpath attributes to use e.g. ["href"] or ["foo", "bar"] for nested attributes like foo.bar
   * @param keywordsEnabled  whether to use the next or prev keywords as a fallback to the selector/xpath rule
   * @param keywords         the next or prev keywords list to use
   * @param decodeURIEnabled whether to decode the URI or not
   * @param debugEnabled     if debug mode is enabled (to highlight the next/prev DOM element)
   * @param document_        (optional) Infy Scroll only: the current document on the page to query
   * @returns {*} the next or prev url (if found) along with the subtype and keyword that was used to find it
   * @public
   */
  function findNextPrevURL(type, selector, xpath, attribute, keywordsEnabled, keywords, decodeURIEnabled, debugEnabled, document_) {
    console.log("findNextPrevURL() - type=" + type + ", selector=" + selector + ", xpath=" + xpath + ", attribute=" + attribute + ", keywordsEnabled=" + keywordsEnabled + ", keywords=" + keywords + ", document=" + (document_ ? document_.location : "") + ", debugEnabled=" + debugEnabled);
    // The urls object stores the rule URL (sox: selector or xpath), attribute, innerText, and innerHTML links that were found
    const urls = {
      "sox": undefined,
      // "attribute": { "equals": new Map(), "startsWith": new Map(), "includes": new Map(), "rel": new Map() },
      "attribute": { "equals": new Map(), "startsWith": new Map(), "endsWith": new Map(), "includes": new Map() },
      "innerText": { "equals": new Map(), "startsWith": new Map(), "endsWith": new Map(), "includes": new Map() },
      "innerHTML": { "equals": new Map(), "startsWith": new Map(), "endsWith": new Map(), "includes": new Map() }
    };
    // Note: the algorithm order matters, the highest priority algorithms are first when they are iterated below
    const algorithms = [
      // { "type": "attribute", "subtypes": ["rel"] },
      { "type": "attribute", "subtypes": ["equals"] },
      { "type": "innerText", "subtypes": ["equals"] },
      { "type": "innerHTML", "subtypes": ["equals"] },
      // Combined startsWith, endsWith, and includes for priority on keywords instead of the subtypes
      { "type": "attribute", "subtypes": ["startsWith", "endsWith", "includes"] },
      { "type": "innerText", "subtypes": ["startsWith", "endsWith", "includes"] },
      { "type": "innerHTML", "subtypes": ["startsWith", "endsWith", "includes"] }
    ];
    // Stores the exception or error message in order to return it back to the user for feedback (e.g. invalid selector)
    const details = { error: undefined };
    // If not parsing a specific document, assume this is the root HTML document
    if (!document_) {
      document_ = document;
    }
    checkRule(urls, type, selector, xpath, attribute, decodeURIEnabled, document_, details);
    // If a URL was found using the selector or xpath rule, return it (minus the element)
    if (urls.sox) {
      console.log("findNextPrevURL() - found a URL using the " + urls.sox.method + " rule " + urls.sox.rule + ": " + urls.sox.url);
      highlightElement(urls.sox.element, debugEnabled);
      return { "url": urls.sox.url, "method": urls.sox.method, "rule": urls.sox.rule, "element": urls.sox.element.elementName };
    }
    // If keywordsEnabled, check keywords and return the result if found
    if (keywordsEnabled) {
      checkKeywords(urls, keywords, decodeURIEnabled, document_, details);
      console.log("findNextPrevURL() - found the following next/prev URLs via keywords (no rule match):");
      console.log(JSON.stringify(Object.values(urls)));
      for (const algorithm of algorithms) {
        const result = traverseURLs(urls, algorithm.type, algorithm.subtypes, keywords, debugEnabled);
        if (result) {
          return result;
        }
      }
    }
    // If still haven't returned a URL, return the error
    return details;
  }

  /**
   * Checks if the selector or xpath rule matches against an element's attribute (i.e. a.href).
   *
   * @param urls             the urls object stores important, attribute, innerText, and innerHTML links that were found
   * @param type             the link type to use: important, attributes or innerHTML
   * @param selector         the next or prev css selector rule to use
   * @param xpath            the next or prev xpath rule to use
   * @param attribute        the next or prev css selector/xpath attribute to use
   * @param decodeURIEnabled whether to decode the URI or not
   * @param document_        the current document on the page to query
   * @param details          the details object that stores details about this action, such as error messages that were caught
   * @private
   */
  function checkRule(urls, type, selector, xpath, attribute, decodeURIEnabled, document_, details) {
    try {
      let element;
      let defaultAttribute;
      if (type === "xpath") {
        element = document_.evaluate(xpath, document_, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } else {
        element = document_.querySelector(selector);
      }
      // No element found, don't bother continuing. We don't want to put any unnecessary errors into details at this point as the rule was valid if it got to this point
      if (!element) {
        return;
      }
      let url = element[attribute[0]];
      for (let i = 1; i < attribute.length; i++) {
        url = url[attribute[i]];
      }
      // If no URL was found using the specified attribute, try using hard-coded attributes that are known to contain URLs
      if (!url) {
        defaultAttribute = element.href ? "href" : element.action ? "action" : element.formAction ? "formAction" : undefined;
        // If we found a URL using one of the default attributes, set to true
        if (defaultAttribute) {
          attribute = [defaultAttribute];
          url = element[attribute[0]];
        }
      }
      if (decodeURIEnabled) {
        try {
          url = decodeURIComponent(url);
        } catch(e) {
          console.log("checkRule() - Exception caught decoding URL:" + e);
          details.error = e.message;
        }
      }
      if (isValidURL(url, details)) {
        // TODO: i18n This whole object, especially defaultAttribute
        urls.sox = { "url": url, "method": type, "rule": (type === "xpath" ? xpath : selector) + "." + attribute.join(".") + (defaultAttribute ? " (Using the Default Attribute)" : ""), "element": element };
      }
    } catch(e) {
      console.log("checkRule() - Exception caught when querying for selector or evaluating xpath: " + e);
      details.error = e.message;
    }
  }

  /**
   * Checks the keywords against all elements with a URL (i.e. href attribute).
   * Checks that the URL is valid and then checks the element's parent and the element itself if the keyword matches.
   *
   * @param urls             the urls object stores important, attribute, innerText, and innerHTML links that were found
   * @param keywords         the next or prev keywords list to use
   * @param decodeURIEnabled whether to decode the URI or not
   * @param document_        the current document on the page to query
   * @param details          the details object that stores details about this action, such as error messages that were caught
   * @private
   */
  function checkKeywords(urls, keywords, decodeURIEnabled, document_, details) {
    const elements = document_.querySelectorAll("link[href], a[href], area[href], form[action], button[formaction]");
    for (const element of elements) {
      try {
        // Check if URL is in same domain if enabled, wrap in try/catch in case of exceptions with URL object
        const elementName = element.nodeName.toLowerCase();
        let url = element.href ? element.href : elementName === "form" && element.action ? element.action : element.tagName === "button" && element.formAction ? element.formAction : "";
        if (decodeURIEnabled) {
          try {
            url = decodeURIComponent(url);
          } catch(e) {
            console.log(e);
            details.error = e.message;
          }
        }
        if (isValidURL(url, details)) {
          // Check parent element. Sometimes the anchor is wrapped inside another element (like a li) with the keyword
          // if (element && element.parentNode) {
          //   checkElement(urls, keywords, url, elementName, element.parentNode, "parent");
          // }
          // Check children (innerHTML)
          // if (element && element.children && element.children.length > 0) {
          //   checkChildElements(urls, keywords, url, elementName, element.children, 1);
          // }
          // TODO: Check element.nextSibling?
          // Check the actual element last (after the parent) to prioritize it
          checkElement(urls, keywords, url, elementName, element, "");
        }
      } catch (e) {
        console.log("buildURLs() - exception caught:" + e);
        details.error = e.message;
      }
    }
  }

  /**
   * Checks if this element matches any of the keywords. This checks the element in multiple ways, including its
   * attribute, innerText, innerHTML.
   *
   * @param urls        the urls object stores important, attribute, innerText, and innerHTML links that were found
   * @param keywords    the next or prev keywords list to use
   * @param url         the URL of the link
   * @param elementName the element's name
   * @param children    the element
   * @param level       the children level, e.g. first-level children, second-level children, ... up to 5
   * @private
   */
  function checkChildElements(urls, keywords, url, elementName, children, level) {
    console.log("checkChildElements() - elementName=" + elementName + " children.length=" + (children ? children.length : "undefined")  + ", level=" + level);
    for (const child of children) {
      checkElement(urls, keywords, url, elementName, child, "child");
      if (child && child.children && child.children.length > 0 && level < 5000) {
        checkChildElements(urls, keywords, url, elementName, child.children, level + 1);
      }
    }
  }

  /**
   * Checks if this element matches any of the keywords. This checks the element in multiple ways, including its
   * attribute, innerText, innerHTML.
   *
   * @param urls         the urls object stores important, attribute, innerText, and innerHTML links that were found
   * @param keywords     the next or prev keywords list to use
   * @param url          the URL of the link
   * @param elementName  the element's name
   * @param element      the element
   * @param relationship the element's relationship (e.g. self is "" or parent is "parent")
   * @private
   */
  function checkElement(urls, keywords, url, elementName, element, relationship) {
    if (element) {
      // TODO: Should this check after each parseText and return immediately if it found a URL since algorithm already does this?
      for (const attribute of element.attributes) {
        if (attribute && attribute.nodeValue && attribute.nodeName) {
          parseText(urls, keywords, "attribute", url, attribute.nodeValue.replace(/\s/g, "").toLowerCase(), elementName, element, attribute.nodeName.toLowerCase(), relationship);
        }
      }
      if (element.innerText) {
        parseText(urls, keywords, "innerText", url, element.innerText.replace(/\s/g, "").toLowerCase(), elementName, element, undefined, relationship);
      }
      // Only check the innerHTML if this is the element itself i.e. a relationship does NOT exist. We do not want to check parent element's innerHTML, as that could be quite lengthy!
      // if (!relationship) {
      //   parseText(urls, keywords, "innerHTML", url, element.innerHTML.replace(/\s/g, "").toLowerCase(), elementName, element, undefined, relationship);
      // }
      // TODO: Also check other properties like background-image using window.getComputedStyle()? However, we can't use getComputedStyle() unless the element is already in the DOM...
      // parseText(urls, keywords, "backgroundImage", url, element.ownerDocument.defaultView.getComputedStyle(element).backgroundImage.replace(/\s/g, "").toLowerCase(), elementName, element, undefined, relationship);
    }
  }

  /**
   * Parses an element's text for keywords that might indicate a next or prev link.
   * Adds the link to the urls map if a match is found.
   *
   * @param urls         the urls object stores important, attribute, innerText, and innerHTML links that were found
   * @param keywords     the next or prev keywords list to use
   * @param type         the type of element text value to parse: attribute, innerText, or innerHTML
   * @param url          the URL of the link
   * @param text         the element's attribute value, innerText, or innerHTML to parse keywords from
   * @param elementName  the element's name
   * @param element      the element
   * @param attribute    (optional) the element attribute's node name if it's needed
   * @param relationship the element's relationship (e.g. self is "" or parent is "parent")
   * @private
   */
  function parseText(urls, keywords, type, url, text, elementName, element, attribute, relationship) {
    const value = { url: url, element: element, elementName: elementName, attribute: attribute, relationship: relationship };
    for (const keyword of keywords) {
      // TODO: Exclude Certain types and keywords
      // TODO: next: text.endsWith(keyword) && type !== "innerHTML" && keyword !== ">"
      // TODO: prev: && keyword !== "<" && type !== "innerHTML"
      if (text === keyword) {
        urls[type].equals.set(keyword, value);
      } else if (text.startsWith(keyword)) {
        urls[type].startsWith.set(keyword, value);
      } else if (text.endsWith(keyword)) {
        urls[type].endsWith.set(keyword, value);
      } else if (text.includes(keyword)) {
        urls[type].includes.set(keyword, value);
      }
    }
  }

  /**
   * Traverses the urls object to see if a URL was found. e.g. urls[attributes][equals][next]
   *
   * @param urls         the urls object stores attribute, innerText, and innerHTML links that were found
   * @param type         the algorithm main type to use: attribute, innerText, or innerHTML
   * @param subtypes     the algorithm subtypes to use: equals, startsWith, endsWith, includes
   * @param keywords     the ordered list of keywords sorted in priority
   * @param debugEnabled if debug mode is enabled (to highlight the next/prev DOM element)
   * @returns {*} the next or prev url (if found) along with the subtype and keyword that was used to find it
   * @private
   */
  function traverseURLs(urls, type, subtypes, keywords, debugEnabled) {
    for (const keyword of keywords) {
      for (const subtype of subtypes) {
        if (urls[type][subtype].has(keyword)) {
          const value = urls[type][subtype].get(keyword);
          console.log("traverseResults() - a next/prev link was found:" +  type + " - " + subtype + " - " + keyword + " - " + value.element + " - " + value.relationship + " - " + value.attribute + " - " + value.url);
          highlightElement(value.element, debugEnabled);
          return { url: value.url, method: "keyword", type: type, subtype: subtype, keyword: keyword, element: value.elementName, attribute: value.attribute, relationship: value.relationship };
        }
      }
    }
  }

  /**
   * Determines if a potential URL is a valid URL.
   * Rules: A URL must 1) be parsed as a URL object, 2) have a href and not be the existing URL, 3) be in the same domain (hostname)
   *
   * @param url     the URL to parse
   * @param details the details object that stores details about this action, such as error messages that were caught
   * @returns {boolean} true if the URL is a valid URL, false otherwise
   * @private
   */
  function isValidURL(url, details) {
    let valid = false;
    try {
      const url_ = new URL(url);
      valid = url_ && url_.href && url_.href !== window.location.href && url_.hostname === window.location.hostname;
    } catch (e) {
      console.log("isValidURL() - exception caught: " + e);
      details.error = e.message;
    }
    return valid;
  }

  function isValidExtension(url, details) {
    let valid = true;
    try {
      const filenameAndExtension = url.split('#').shift().split('?').shift().split('/').pop();
      if (filenameAndExtension.includes(".")) {
        const extension = filenameAndExtension.toLowerCase().split('.').pop();
        console.log("isValidExtension() - extension=" + extension);
        const invalidExtensions = ["css", "js"];
        if (invalidExtensions.includes(extension)) {
          valid = false;
          details.error = "invalid extension:" + extension;
        }
      }
    } catch(e) {
      console.log("isValidExtension() - exception caught: " + e);
    }
    return valid;
  }

  /**
   * Highlights the next or prev element on the document page (if debug mode is enabled).
   *
   * @param element      the DOM element to highlight
   * @param debugEnabled if debug mode is enabled (to highlight the next/prev DOM element)
   * @private
   */
  function highlightElement(element, debugEnabled) {
    if (debugEnabled) {
      try {
        element.style.outline = "3px solid black";
        element.style.backgroundColor = "#FDFF47";
        setTimeout(function () {
          element.style.outline = "";
          element.style.backgroundColor = "";
        }, 5000);
      } catch(e) {
        console.log("highlightElement() - exception caught, error=" + e);
      }
    }
  }

  // Return Public Functions
  return {
    findNextPrevURL: findNextPrevURL
  };

})();