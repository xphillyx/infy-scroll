/**
 * Infy Scroll
 * @file scroll.js
 * @author Roy Six
 * @license TBD
 */

/**
 * Scroll is the main content script of the extension and handles all infinite scroll-specific logic.
 *
 * This includes the following three main purposes:
 * 1. Scroll Detection - This can either be a Scroll Listener or Intersection Observer
 * 2. Appending of Pages - Supports 4 modes: Page, Iframe, Element, and Media
 * 3. Getting the Next Document - Via Fetch or XHR (Fallback)
 *
 * Note that the instance is primarily stored in this object. Therefore, if the Action or other area of the extension
 * needs access to it, a getter is provided.
 *
 * Important note about the storage items:
 * We ONLY update the items when the extension's on/off state has changed in Scroll.stop() (which is called by Action).
 * We will NOT update the storage items for other settings that change after the page loads (e.g. if the user
 * tried changing the Scroll Detection API from Scroll Listener to Intersection Observer, as that is unrealistic to
 * expect).
 *
 * We also do NOT update the storage items if the user tries turning the extension BACK ON because we do not ever
 * send a message to all other tabs to "turn on." The user is expected to click on the toolbar icon or to refresh
 * the page due to the complexity involved in handling multiple on/off state changes of a complex application like
 * Infy Scroll. I may decide to allow this in the future if it is really needed.
 *
 * TODO: Make the on/off and stop/start states less complicated.
 * TODO: Consider moving all the Append Element code into its own file: element.js
 * TODO: Decide on using window.scrollY or window.pageYOffset (both are the same, the latter has IE compatibility).
 */
var Scroll = Scroll || (() => {

  /**
   * Variables
   *
   * @param PAGE_STYLE   the css that is used for Append Page
   * @param IFRAME_STYLE the css that is used for Append Iframe
   * @param MEDIA_STYLE  the css that is used for Append Media
   * @param COLOR        the css color that is used for various styles, like the infinity icon and page divider
   * @param instance     the instance object that contains all the properties for this page (such as URL and the action)
   * @param items        the storage items cache containing the user's options
   * @param pages        the pages array that contains a reference to each appended page in the DOM
   * @param document_    the document for the current (latest) page that is being observed; we need a reference to the newly appended page's document
   * @param insert_      the insertion point is only used in append element mode and is the point at the bottom of the content to start inserting more elements
   * @param offset       the offset is only used in append element mode and is the pixels from the bottom of the elements' content to the very bottom of the HTML document
   * @param loading      the loading element that is appended while a new page is being loaded
   * @param divider      the last page divider element that was appended; we store this in order to not have to re-calculate the colSpan again for future dividers in Append Element mode (tables)
   * @param overlay      (optional) the overlay element that is fixed onto the page, showing the current page number and total pages
   * @param timeouts     the reusable timeouts object that stores all named timeouts used on this page
   * @param observer     the intersection observer
   */
  const PAGE_STYLE = "display: block; visibility: visible; float: none; clear: both; width: auto; height: auto; background: initial; border: 0; border-radius: 0; margin: 0 0 2rem 0; padding: 0; z-index: 2147483647;";
  const IFRAME_STYLE = "display: block; visibility: visible; float: none; clear: both; width: 100%; height: 0; background: initial; border: 0; border-radius: 0; margin: 0 0 2rem 0; padding: 0; z-index: 2147483647; overflow: hidden;";
  const MEDIA_STYLE = "display: flex; visibility: visible; float: none; clear: both; width: auto; height: auto; background: initial; border: 0; border-radius: 0; margin: 2rem auto; padding: 0; z-index: 2147483647;";
  const COLOR = "#55555F";
  let instance;
  let items;
  let pages = [];
  let document_ = document;
  let insert_;
  let offset = 0;
  let loading;
  let divider;
  let overlay;
  let timeouts = {};
  let observer;

  /**
   * Gets the instance.
   *
   * @returns {*} instance the instance
   * @public
   */
  function getInstance() {
    return instance;
  }

  /**
   * Sets the instance.
   *
   * @param instance_ the instance to set
   * @public
   */
  function setInstance(instance_) {
    instance = instance_;
  }

  /**
   * Gets the pages.
   *
   * @returns {*} pages the pages
   * @public
   */
  function getPages() {
    return pages;
  }

  /**
   * Sets the pages.
   *
   * @param pages_ the pages to set
   * @public
   */
  function setPages(pages_) {
    pages = pages_;
  }

  /**
   * Gets the document.
   *
   * @returns {*} document the document
   * @public
   */
  function getDocument() {
    return document_;
  }

  /**
   * Gets the insertion point element in Append Element mode (currently only used for debugging in the console).
   *
   * @returns {*} the insertion point element used in append element mode
   * @public
   */
  function getInsert() {
    return insert_;
  }

  /**
   * Adds the scroll detection (either Scroll Listener or Intersection Observer).
   *
   * @public
   */
  function addScrollDetection() {
    removeScrollDetection();
    console.log("addScrollDetection() - adding " + items.scrollDetection);
    // Can't use Intersection Observer when scroll action is button because there is no element to observe
    if (items.scrollDetection === "io" && instance.scrollAction !== "button") {
      // Observer rootMargin '0px 0px -99%' will only trigger when the top of the next page has been intersected. Use 0% or 1% to intersect the earliest (when any part of the next page is on the screen)
      observer = new IntersectionObserver(intersectionObserver, { root: null, rootMargin: '0px 0px 1%', threshold: 0});
      // Need this for loop to 1) observe the first page due to prepareFirstPage() being called before the observer is made, and 2) when re-enabling an instance after a stop
      for (const page of pages) {
        observer.observe(page.point);
      }
    } else {
      // Scroll Listener passive should already be the default on scroll events
      window.addEventListener("scroll", scrollListener, { passive: true });
    }
  }

  /**
   * Removes the scroll detection (either Scroll Listener or Intersection Observer).
   *
   * @public
   */
  function removeScrollDetection() {
    console.log("removeScrollDetection() - removing " + items.scrollDetection);
    if (items.scrollDetection === "io" && instance.scrollAction !== "button" && observer) {
      observer.disconnect();
      // We set to undefined because we check if the observer exists to determine which mode we are in shouldAppend()
      observer = undefined;
    } else {
      window.removeEventListener("scroll", scrollListener);
    }
  }

  /**
   * Throttles the callback function by the specified wait (ms).
   * Note: This function is derived from code written by robertmirro @ github.com.
   * TODO: Investigate using rIC (requestIdleCallback) and rAF (requestAnimationFrame) for appending to the DOM.
   *
   * @param fn   the callback function to throttle
   * @param wait the time in ms to wait (throttle)
   * @returns {invokeFn} the invoked function
   * @see https://gist.github.com/beaucharman/e46b8e4d03ef30480d7f4db5a78498ca#gistcomment-3015837
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
   * @private
   */
  function throttle(fn, wait) {
    let previouslyRun = 0;
    return function invokeFn() {
      const now = Date.now();
      const elapsed = now - previouslyRun;
      timeouts.throttleQueue = clearTimeout(timeouts.throttleQueue);
      if (elapsed >= wait) {
        console.log("throttle() - executing fn, wait=" + wait + ", elapsed=" + elapsed);
        fn();
        previouslyRun = now;
      } else {
        timeouts.throttleQueue = setTimeout(invokeFn, wait - elapsed);
      }
    }
  }

  /**
   * The callback function for the Scroll Listener that fires every time the user scrolls (scroll event). It calls the
   * reusable scrollDetection function to perform the work. This function is throttled to not run more than once in a
   * specified time frame.
   *
   * Note: Unfortunately, this has to be written as a variable instead of a function due to tricky way event listeners
   * work.
   *
   * @private
   */
  let scrollListener;

  /**
   * The callback function for the Intersection Observer. Observes all page entries when they intersect (are visible) in
   * the root (document body). Whenever a new entry is intersecting, we call the reusable scrollDetection function to
   * perform the work.
   *
   * @param entries the page entries being observed
   * @private
   */
  function intersectionObserver(entries) {
    // TODO: Investigate if reversing the entries so that the last pages are iterated first is better for efficiency?
    entries.reverse();
    for (const entry of entries) {
      if (entry.isIntersecting) {
        console.log("intersectionObserver() - an entry is intersecting: " + (entry.target ? entry.target.id : entry.target));
        // TODO: Is this setTimeout not needed anymore? This timeout is an unfortunate compromise to avoid the intersectionObserver from firing scrollDetection() at the same time as append() to avoid a double performAction
        // setTimeout(() => { scrollDetection(entry); }, items.scrollDetectionThrottle);
        scrollDetection(entry);
        break;
      }
    }
  }

  /**
   * The detection function that does all the work when scrolling. This is called by both the Scroll Listener and
   * Intersection Observer.
   *
   * It calls the following functions and determines the following logic:
   * 1. detectCurrentPage() - What the current page is as the user scrolls
   * 2. shouldAppend() - When a new page should be added
   *
   * @param entry (optional) if using Intersection Observer API, the entry (page) we are currently intersecting
   * @private
   */
  function scrollDetection(entry) {
    detectCurrentPage(entry ? entry.target : undefined);
    if (shouldAppend()) {
      instance.isLoading = true;
      Action.performAction(instance.scrollAction, "scrollDetection", instance, items, undefined, document_);
    }
  }

  /**
   * Determines if a vertical scrollbar is present on the screen. The extension will only check a maximum of 10 times.
   *
   * Note: This check is only performed when in Intersection Observer mode. This is due to the Scroll Listener's pixels
   * check implicitly already checking this.
   *
   * @returns {boolean} true if a vertical scrollbar exists, false otherwise
   * @see https://stackoverflow.com/questions/1145850/how-to-get-height-of-entire-document-with-javascript
   * @private
   */
  function scrollbarExists() {
    let exists = true;
    let documentHeight = -1;
    if (!instance.scrollbarExists && instance.scrollbarAppends < 10) {
      const html = document.documentElement;
      const body = document.body;
      // Normally we would only care about the body clientHeight when calculating the document's height. However some websites are coded strangely where their height may not be calculated based on just that, so we look at the max from all possible height values from both the html and body
      documentHeight = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.clientHeight, body.scrollHeight, body.offsetHeight);
      // A scrollbar exists if the document's height is bigger than the window's height. TODO: Test this more e.g. > vs >=
      exists = documentHeight > window.innerHeight;
      // If a scrollbar exists, we will stop checking. Otherwise, we increment the appends value so we only append a max of 10 pages due to lack of scrollbar
      if (exists) {
        instance.scrollbarExists = true;
      } else {
        instance.scrollbarAppends++;
      }
    }
    console.log("scrollbarExists() - scrollbarExists=" + instance.scrollbarExists + ", scrollbarAppends=" + instance.scrollbarAppends + ", window.innerHeight=" + window.innerHeight + ", documentHeight=" + documentHeight);
    return exists;
  }

  /**
   * Determines if the user has scrolled near the bottom of the document by a certain number of pages.
   * Note: This function is only called when the scroll detection mode is Intersection Observer.
   *
   * Examples (based on the instance.scrollAppendThresholdPages):
   * 1. If the threshold pages value is 1, this checks if the user scrolled within 1 page of the last page of the document (i.e. the next-to-last page).
   * 2. If the threshold pages value is 0, this essentially checks if the user has scrolled to the last page of the document.
   *
   * @returns {boolean} true if scrolled near the bottom of the document by the pages metric, false otherwise
   * @private
   */
  function scrolledNearBottomPages() {
    console.log("scrolledNearBottomPages() - currentPage=" + instance.currentPage + ", totalPages=" + instance.totalPages + ", thresholdPages=" + instance.scrollAppendThresholdPages + ", scrolled=" + ((instance.totalPages - instance.currentPage) <= instance.scrollAppendThresholdPages));
    return ((instance.totalPages - instance.currentPage) <= instance.scrollAppendThresholdPages);
  }

  /**
   * Determines if the user has scrolled near the bottom of the content by a certain number of pixels. The "content" is
   * either the entire HTML Document (in Page, Iframe, or Media modes) or the elements (in Element mode).
   * For example, if the pixels value is 1000px, this checks if the user scrolled within 1000px of the bottom of the
   * content.
   *
   * Note: This function is only called when the scroll detection mode is Scroll Listener.
   *
   * @returns {boolean} true if scrolled near the bottom of the content by the pixels metric, false otherwise
   * @private
   */
  function scrolledNearBottomPixels() {
    const html = document.documentElement;
    const body = document.body;
    // This is the complete bottom of the document. Normally we only care about the body clientHeight when calculating the total height. However, some websites are coded strangely where their height may not be calculated based on just that, so we look at the max from all possible height values from both the html and body
    const bottom = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.clientHeight, body.scrollHeight, body.offsetHeight);
    // This is the actual bottom we care about. In all modes except Append Element mode, it's the same as the bottom. But in Append Element mode, we need to subtract the offset from the bottom. The offset is the space from the insertion point (the bottom of the elements) to the very bottom of the document. The offset is 0 in all other modes
    const contentBottom = bottom - offset;
    // This is the current position of the scrollbar. The scroll position can also be calculated to just be window.scrollY without the window.innerHeight and this would be the TOP position of the grayed portion of the scrollbar instead of its BOTTOM position
    const scrollPosition = window.scrollY + window.innerHeight;
    // This is the amount of pixels left until reaching the bottom. Because JavaScript gives us precise subpixel values (e.g. decimal numbers like 1200.5) we will floor the value. This is useful when scrolling to the bottom of the document and ensuring a 0.5 is treated as 0
    const pixelsLeft = Math.floor(contentBottom - scrollPosition);
    // TODO: When we were only using the document height, we could do the following check instead of checking for scrollAppendThresholdPixels, but now we are getting negative values due to using element_'s height in Append Element mode. Perhaps unnecessary, but to be safe from the flooring, we will ensure the scrollPixels is not negative if returning true: scrollPixels >= 0 &&
    // const scrolled = bottom > 0 && pixelsLeft <= instance.scrollAppendThresholdPixels;
    const scrolled = pixelsLeft <= instance.scrollAppendThresholdPixels;
    console.log("scrolledNearBottomPixels() - contentBottom=" + contentBottom + ", bottom=" + bottom + ", offset=" + offset + ", scrollPosition=" + scrollPosition + ", pixelsLeft=" + pixelsLeft + ", thresholdPixels=" + instance.scrollAppendThresholdPixels + ", scrolled=" + scrolled);
    return scrolled;
  }

  /**
   * Determines if the extension should append another page. This only happens when the following conditions are met:
   * 1. The instance is enabled (after stop is called, it is no longer enabled)
   * 2. There isn't a page currently being loaded (e.g. fetched)
   * 3. Auto isn't enabled (as auto handles this on its own)
   * 4. The user has scrolled near the bottom (either by pixels or pages, depending on the scroll detection mode)
   *
   * @returns {boolean} true if a new page should be appended, false otherwise
   * @private
   */
  function shouldAppend() {
    console.log("shouldAppend() - observer=" + observer + ", instance.isLoading=" + instance.isLoading);
    // Scrollbar Exists check only needs to occur when in Intersection Observer mode because the pixels checks this already implicitly
    return instance.enabled && !instance.isLoading && !instance.autoEnabled && (observer ? !scrollbarExists() || scrolledNearBottomPages() : scrolledNearBottomPixels());
  }

  /**
   * Detects what the current page is.
   *
   * Handles setting the current page # scrolled into view, the history push state (if enabled), updating the tab title
   * (if enabled), and the page overlay (if enabled). This function is called by both the scroll listener and
   * intersection observer.
   *
   * @param element the page element intersected (only if called by the intersection observer)
   * @private
   */
  function detectCurrentPage(element) {
    for (const page of pages) {
      // Two Cases: If using Intersection Observer, check if element === page.point, else if Scroll Listener check isScrolledIntoView()
      if (page && page.point && (element ? element === page.point : isScrolledIntoView(page.point))) {
        instance.currentPage = page.number;
        console.log("detectCurrentPage() - page.number=" + page.number + ", page.url=" + page.url);
        // If this is not a local file URL, can update history or title
        if (!instance.isLocal) {
          // Check if the address bar (window.location.href) hasn't already been updated with this page's url to avoid unnecessarily setting it again
          if (instance.scrollUpdateAddress && page.url && window.location.href !== page.url) {
            // Because scrollDetectionThrottle has a hard-minimum of 100ms, we don't need to worry about adding a timeout to replace the history state too often (the minimum safe is 25ms before browsers start to complain)
            window.history.replaceState(undefined, undefined, page.url);
          }
          // Check if the document title hasn't already been set with this page's title to avoid unnecessarily setting it again
          if (instance.scrollUpdateTitle && page.title && document.title !== page.title) {
            document.title = page.title;
          }
        }
        // Update the Page Overlay with the current page number (if the setting is enabled)
        if (instance.scrollOverlay && overlay && overlay.children[1]) {
          overlay.children[1].textContent = "Page " + instance.currentPage + " / " + instance.totalPages;
          if (items.debugEnabled && overlay.children[2]) {
            const html = document.documentElement;
            const body = document.body;
            const bottom = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.clientHeight, body.scrollHeight, body.offsetHeight);
            overlay.children[2].textContent = "Debug Mode - bottom=" + bottom + ", 0.75 bottom offset=" + (bottom - (bottom * 0.75)) + ", offset=" + offset;
          }
        }
        break;
      }
    }
  }

  /**
   * Determines if the element (e.g. page) has been scrolled into the current viewport.
   * Note: This function is only called in Scroll Listener mode.
   *
   * @param element the element (e.g. page)
   * @returns {boolean} true if the element has been scrolled into view, false otherwise
   * @private
   */
  function isScrolledIntoView(element) {
    let isInView = false;
    const rect = element.getBoundingClientRect();
    // The rect.height > 0 part allows us to ignore new pages that are still loading at the bottom that are about to be appended
    if (rect && rect.height > 0) {
      // The algorithm to detect if an element is in view depends on whether it is taller than the window or not
      // If element is taller than window... (Note: Math.round() because getBoundingClientRect return subpixel values with decimal places e.g. 409.99)
      if (Math.round(rect.height) >= window.innerHeight) {
        // ...then check if element is partially visible
        isInView = rect.top <= 1 && rect.bottom >= 0;
      } else {
        // ...else check if element is fully visible
        isInView = rect.top >= -1 && rect.bottom <= window.innerHeight;
      }
      // Don't print out console.log statements unless it's in view to avoid cluttering console
      console.log(isInView ? "isScrolledIntoView() - element.id=" + element.id + ", isInView=" + isInView : "");
    }
    return isInView;
  }

  /**
   * Appends a new page using one of the append modes.
   *
   * @param caller string indicating who called this function (e.g. command, popup, content script)
   * @public
   */
  function append(caller) {
    switch (instance.scrollAppend) {
      case "page":    appendDivider(); appendPage(caller);    appendLoading(); break;
      case "iframe":  appendDivider(); appendIframe(caller);  appendLoading(); break;
      case "element": appendDivider(); appendElement(caller); appendLoading(); break;
      case "media":   appendDivider(); appendMedia(caller);   appendLoading(); break;
      case "none":                     appendNone(caller);                     break;
      default:                                                                 break;
    }
  }

  /**
   * Appends the next page's HTML as is to the original document's body.
   * Images and HTML may break in this mode, but it is the fastest append mode.
   *
   * @param caller who called this function
   * @private
   */
  async function appendPage(caller) {
    console.log("appendPage() - caller=" + caller + ", instance.url=" + instance.url + ", pages.length=" + (pages.length + 1));
    const page = document.createElement("div");
    page.style = PAGE_STYLE;
    document.body.appendChild(page);
    const nextDocument = await getNextDocument();
    // TODO: Look at this some more...
    if (!nextDocument) {
      appendFinally("page", undefined, caller);
      return;
    }
    const fragment = document.createDocumentFragment();
    nextDocument.body.querySelectorAll(":scope > *").forEach(element => fragment.appendChild(element));
    page.appendChild(fragment);
    resizeMedia("page", page);
    appendFinally("page", page, caller);
    // TODO: Don't wrap the page in a div anymore. Use the code below and use getElementsByTreeWalker() to pick an element to be the observable page element
    // const nextDocument = await getNextDocument();
    // const fragment = document.createDocumentFragment();
    // const elements = [...nextDocument.body.querySelectorAll(":scope > *")];
    // const welements = items.resizeMediaEnabled ? getElementsByTreeWalker(nextDocument.body, NodeFilter.SHOW_ELEMENT) : [];
    // elements.forEach(element => fragment.appendChild(element));
    // document.body.appendChild(fragment);
    // let pageElement = getPageElement(elements);
    // if (!pageElement) {
    //   pageElement = document.createElement("span");
    //   document.body.insertBefore(pageElement, elements[0]);
    //   // elements.unshift(pageElement);
    // }
    // resizeMedia("page", document.body, welements);
    // appendFinally("page", pageElement, caller);
  }

  /**
   * Appends the next page in an iframe to isolate complex pages and prevent HTML and images from breaking.
   * This mode runs slower than append page mode and clicking on a link in an iframe may be problematic if the domain
   * differs because the link opens in the same frame.
   *
   * @param caller who called this function
   * @private
   */
  function appendIframe(caller) {
    console.log("appendIframe() - caller=" + caller + ", instance.url=" + instance.url + ", pages.length=" + (pages.length + 1));
    const iframe = document.createElement("iframe");
    iframe.src = instance.url;
    iframe.style = IFRAME_STYLE;
    iframe.scrolling = "no";
    iframe.frameBorder = "0";
    // TODO: Make a final decision on sandboxing
    // sandbox iframe to avoid "For security reasons, framing is not allowed; click OK to remove the frames."
    // @see https://meta.stackexchange.com/questions/155720/i-busted-the-stack-overflow-frame-buster-buster-buster
    // @see https://stackoverflow.com/a/9163087
    // iframe.sandbox = "allow-same-origin allow-scripts allow-forms";
    document.body.appendChild(iframe);
    iframe.onload = function() {
      console.log("appendIframe() - iframe.onload() - the iframe loaded");
      document_ = iframe.contentDocument;
      const html = document_.documentElement;
      const body = document_.body;
      resizeMedia("iframe", body);
      const height = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.clientHeight, body.scrollHeight, body.offsetHeight);
      iframe.style.height = height && height > 0 ? height + "px" : "auto";
      html.style.overflow = body.style.overflow = "hidden";
      appendFinally("iframe", iframe, caller);
    };
    // TODO: Show an error message on the page that infy can't use this mode. Also, error appendFinally needs different handling, don't do the first part
    // iframe.onerror = function() {
    //   console.log("iframe.onerror() - Iframe Error!");
    //   instance.isLoading = false;
    //   appendMessage("Iframes can't be used on this website without using an X-Frame Buster");
    //   appendFinally("iframe", iframe, caller);
    // };
  }

  /**
   * Appends specific elements for seamless scrolling. A page element rule (Selector or XPath) must be specified for the
   * page elements.
   *
   * @param caller who called this function
   * @private
   */
  async function appendElement(caller) {
    console.log("appendElement() - caller=" + caller + ", instance.url=" + instance.url + ", pages.length=" + (pages.length + 1));
    const nextDocument = await getNextDocument();
    // TODO: Look at this some more...
    if (!nextDocument) {
      appendFinally("element", undefined, caller);
      return;
    }
    const fragment = document.createDocumentFragment();
    const elements = getElements(nextDocument);
    elements.forEach(element => fragment.appendChild(element));
    // The insertion point may have been "moved" by the website and no longer have a parentNode, so we re-calculate it to be the last element
    if (!insert_ || !insert_.parentNode || insert_.ownerDocument !== document) {
      console.log("appendElement() - the insertion point's hierarchy in the DOM was altered. parentNode=" + insert_.parentNode + ", ownerDocument === document=" + (insert_.ownerDocument === document))
      insert_ = getInsertElement(getElements(document), false);
    }
    // TODO: This null check bothers me. Should the application simply fail at this point and display an error message?
    if (insert_ && insert_.parentNode) {
       insert_.parentNode.insertBefore(fragment, insert_);
    }
    // Calculate the page element now after the elements are appended (inserted before) so their heights are now accessible
    let pageElement = getPageElement(elements);
    if (!pageElement) {
      console.log("appendElement() - no page element found, manually creating a span");
      pageElement = document.createElement("span");
      insert_.parentNode.insertBefore(pageElement, insert_);
      elements.unshift(pageElement);
    }
    // We must calculate the insert element now before this function is called again and we get the next document
    insert_ = getInsertElement(elements, false);
    // resizeMedia("element", document.body, welements);
    appendFinally("element", pageElement, caller);
  }

  /**
   * Appends a media element directly -- namely images, like 001.jpg. This mode can only be used with actions that allow
   * for sequential URLs such as Increment URL, Decrement URL, or URL List Actions. Care must be taken into
   * consideration when dealing with specific browsers who style the images differently. For example, Firefox adds a
   * position: fixed to the image.
   *
   * Example URL: https://www.example.com/001.jpg
   *
   * @param caller who called this function
   * @private
   */
  function appendMedia(caller) {
    console.log("appendMedia() - caller=" + caller + ", type=" + instance.scrollMediaType + ", instance.url=" + instance.url + ", pages.length=" + (pages.length + 1));
    const media = document.createElement("div");
    media.style = MEDIA_STYLE;
    document.body.appendChild(media);
    switch (instance.scrollMediaType) {
      case "image":
        const img = document.createElement("img");
        img.src = instance.url;
        media.appendChild(img);
        break;
      case "video":
        const video = document.createElement("video");
        video.setAttribute("name", "media");
        video.controls = "controls";
        const source = document.createElement("source");
        source.src = instance.url;
        video.appendChild(source);
        media.appendChild(video);
        break;
    }
    resizeMedia("media", media);
    appendFinally("media", media, caller);
  }

  /**
   * This mode does not append anything. This is for actions that do not append anything (like clicking buttons).
   * The script executes (e.g. clicking a "Load More" button) and it is expected that the website itself appends any
   * additional content. This method also does not call the appendFinally function; there is no new page to push into
   * the pages array. Instead all finalization work is performed in this function.
   *
   * @param caller who called this function
   * @private
   */
  function appendNone(caller) {
    console.log("appendNone() - caller=" + caller);
    setTimeout(() => {
      instance.isLoading = false;
      if (caller !== "prepareFirstPage") {
        instance.totalPages++;
      }
      if (instance.autoEnabled && caller !== "prepareFirstPage") {
        Auto.autoListener(instance);
      } else if (shouldAppend()) {
        instance.isLoading = true;
        Action.performAction(instance.scrollAction, "append", instance, items, undefined, document_);
      }
    }, caller === "auto" ? 100 : items.scrollAppendDelay);
  }

  /**
   * Performs all the finalization work for all append modes after the next page has been appended (except appendNone).
   *
   * @param mode   the append mode, e.g. "page", "iframe", and so on
   * @param el     the appended page to be stored in the pages array
   * @param caller who called this function
   * @private
   */
  function appendFinally(mode, el, caller) {
    console.log("appendFinally() - mode=" + mode + ", el=" + el + ", caller=" + caller);
    if (items.scrollLoading && loading && loading.style) {
      loading.style.display = "none";
    }
    // If no el (e.g. we couldn't find the next page), we need to revert back
    if (!el) {
      console.log("appendFinally() - no el, so removing loading and last divider");
      // if (items.scrollLoading && loading && loading.style) {
      //   loading.style.display = "none";
      // }
      if (divider && divider.remove) {
        divider.remove();
      }
      // TODO: Should we stop at this point?
      // instance.isLoading = false;
      // Action.performAction("stop", "appendFinally", instance, items, undefined, document_);
      return;
    }
    // Append Scripts or Styles (Optional)
    // We must re-create a new script/style object and append them. We can append to document.head or document.body, and they will execute just the same, but appending to head for now to be safe
    // TODO: Investigate why scripts/styles need to be re-created (e.g. script2 and style2)
    try {
      if ((instance.scrollAppend === "element" || instance.scrollAppend === "page") && caller !== "prepareFirstPage") {
        if (instance.scrollAppendScripts) {
          console.log("appendFinally() - appending this page's scripts");
          document_.querySelectorAll("script").forEach(script => { const script2 = document.createElement("script"); script2.textContent = script.textContent; document.head.appendChild(script2);} );
        }
        if (instance.scrollAppendStyles) {
          console.log("appendFinally() - appending this page's styles");
          document_.querySelectorAll("style").forEach(style => { const style2 = document.createElement("style"); style2.textContent = style.textContent; document.head.appendChild(style2);} );
        }
      }
    } catch(e) {
      console.log("appendFinally() - error appending scripts for this page");
    }
    // Part 1: Push new page into array and scroll into view if caller dictates this
    // The "point" is the part we are observing. Make sure to check the divider was appended into the document (Bing Search, for example, removes it if it isn't a li)
    const page = {"number": pages.length + 1, "element": el, "divider": divider, "url": instance.url, "title": document_.title, "point": divider && divider.scrollIntoView && document && document.contains(divider) ? divider : el && el.scrollIntoView ? el : undefined};
    // TODO: Investigate pages.unshift() so that newer pages are first for better performance?
    pages.push(page);
    instance.totalPages = pages.length;
    // This is where we used to append the divider (when it used to always come at the end of the page, e.g. allowing page 1 to have a divider)
    // appendDivider();
    if (observer) {
      observer.observe(page.point);
    }
    // Scroll into view only if shortcuts, popup, or auto slideshow
    if (page && page.point && (caller === "shortcuts" || caller === "popupClickActionButton" || (caller === "auto" && instance.autoSlideshow))) {
      page.point.scrollIntoView({behavior: instance.scrollBehavior, block: "start", inline: "start"});
    }
    if (caller === "popupClickActionButton") {
      // Need to set current page in case scrolling is smooth (finishes after sending instance to popup)
      instance.currentPage = pages.length;
      chrome.runtime.sendMessage({greeting: "updatePopupInstance", instance: instance}, function(response) { if (chrome.runtime.lastError) {} });
    }
    // Part 2: Small timeout to set isLoading flag to false and perform finalization work
    // Delay the append by a small time frame to avoid making too many requests (if caller is not auto)
    setTimeout(()=> {
      console.log("appendFinally() - timeout ended, ready to append the next page");
      instance.isLoading = false;
      // Don't call the autoListener in prepareFirstPage because Popup will have already called startAutoTimer()
      if (instance.autoEnabled && caller !== "prepareFirstPage") {
        Auto.autoListener(instance);
      } else {
        // At this point we can perform the action again if necessary. For example, if there is still no scrollbar, we
        // can perform the action (appending another page). We can also decide to check shouldAppend(), which will check
        // if we are near the bottom in terms of pages or pixels. This is a very important decision, as the extension
        // can keep appending more pages automatically at this point. If we only check for the scrollbar, we can force
        // the extension to only append one page at a time when scrolling, which seems safer. If we do the check for
        // shouldAppend(), we can check if the caller is prepareFirstPage so that it won't append more pages automatically
        // on each page load and waits until the user actually starts scrolling.
        // TODO: Consider implementing a maximum number of consecutive appends that can be done by the pixels and pages thresholds (share this limit with scrollbarAppends?)
        // if (!scrollbarExists()) {
        // if (!scrollbarExists() || (caller !== "prepareFirstPage" && shouldAppend())) {
        // if (!scrollbarExists() || shouldAppend()) {
        if (shouldAppend()) {
          instance.isLoading = true;
          Action.performAction(instance.scrollAction, "append", instance, items, undefined, document_);
        }
      }
    }, caller === "auto" ? 100 : items.scrollAppendDelay);
  }

  /**
   * Gets the next page's document. This method uses the fetch api to make the request, and falls back to XHR if there's
   * an error. It's called by the Append Page and Append Element modes. This method also creates a clone of the document
   * to be used to find the next link.
   *
   * Important: We do not use fetch's standard response.text() here because text() assumes the encoding is UTF-8.
   * Some websites may have different encoding, like SHIFT_JIS for Japanese, so we use response.arrayBuffer() and
   * manually try to use the original document's charset encoding to decode the response text for all subsequent
   * documents.
   *
   * TODO: Don't create a clone of the next document and somehow just keep one "unedited" document while returning the original document. This is hard to achieve.
   *
   * @returns {Promise<Document>} the response document in the original encoding
   * @see https://stackoverflow.com/questions/45512102/can-fetch-do-responsetype-document
   * @see https://stackoverflow.com/a/46784830
   * @private
   */
  async function getNextDocument() {
    console.log("getNextDocument() - documentContentType=" + instance.documentContentType + ", documentCharacterSet=" + instance.documentCharacterSet);
    let nextDocument;
    try {
      const response = await fetch(instance.url, {method: "GET", credentials: "same-origin"});
      // TODO: Investigate and see if a 404 can still happen even if response.ok is true (I think it can)
      if (!response.ok && (instance.scrollAction === "next" || instance.scrollAction === "prev")) {
        console.log("getNextDocument() - returning early because response.ok=" + response.ok);
        return undefined;
      }
      const arrayBuffer = await response.arrayBuffer();
      const dataView = new DataView(arrayBuffer);
      const decoder = new TextDecoder(instance.documentCharacterSet);
      const text = decoder.decode(dataView);
      nextDocument = new DOMParser().parseFromString(text, instance.documentContentType);
    } catch(e) {
      console.log("getNextDocument() - error fetching document, will now fallback to using xhr. error=" + e);
      nextDocument = await Promisify.xhr(instance.url);
    }
    try {
      document_ = nextDocument.cloneNode(true);
      executeCustomScripts(nextDocument);
      // Remove all scripts and styles so they aren't appended. We can append them later if needed with the cloned document
      nextDocument.body.querySelectorAll("script, noscript, style, link").forEach(element => { if (element && element.parentNode) { element.parentNode.removeChild(element); } });
    } catch(e) {
      console.log("getNextDocument() - error cloning document or removing scripts and styles. error=" + e);
    }
    return nextDocument;
  }

  /**
   * Executes custom scripts for specific URLs.
   *
   * @private
   */
  function executeCustomScripts(nextDocument) {
    console.log("executeCustomScripts()");
    // If this instance has a custom script, execute it at this point on the next document's elements (note this must come before we remove disallowed elements like scripts and styles)
    try {
      if (instance.script >= 0 && Scripts[instance.script] && (instance.scrollAppend === "page" || instance.scrollAppend === "element")) {
        console.log("executeCustomScripts() - executing a custom script, script url:" + new TextDecoder().decode(Scripts[instance.script].url));
        Scripts[instance.script].fn(nextDocument);
      }
    } catch(e) {
      console.log("executeCustomScripts() - error executing custom script. error=" + e);
    }
  }

  /**
   * Before Infy can append pages, the first page (existing page on the screen) should be prepared. This is so
   * the extension can store the initial page in the pages array and check when the user has scrolled it into view.
   * The append mode is used to determine how to prepare it. For example, in element mode, the insert_ element needs to
   * be defined.
   *
   * @private
   */
  function prepareFirstPage() {
    console.log("prepareFirstPage()");
    let pageElement;
    switch (instance.scrollAppend) {
      case "page":
      case "iframe":
        // We choose the first page's element by picking the first one with a height > 0 px. We first look at the body's first-level children and then fall-back to walking through every element in the body
        pageElement = getPageElement([...document.body.querySelectorAll(":scope > *")]) || getPageElement(getElementsByTreeWalker(document.body, NodeFilter.SHOW_ELEMENT));
        if (!pageElement) {
          pageElement = document.createElement("span");
          document.body.prepend(pageElement);
        }
        resizeMedia("page", document.body);
        appendFinally("page", pageElement, "prepareFirstPage");
        break;
      case "element":
        const elements = getElements(document);
        insert_ = getInsertElement(elements, true);
        // if (items.debugEnabled && insert_ && insert_.nodeType === Node.TEXT_NODE) {
        //  insert_.textContent = "Infy Scroll (Debug Mode) Insertion Point";
        // }
        // TODO: Decide on how the parent is decided. Should it be the lastElement's parentNode or insert's parentNode? What if the insert element is NOT among the elements. Should we validate this?
        // The parent should prioritize being the insert_'s parentNode instead of the lastElement's parentNode. This is evident on some obscure insertBefore URLs
        // See: https://movie.walkerplus.com/list/2.html
        // parent_ = insert_ && insert_.parentNode ? insert_.parentNode : undefined;
        // lastElement && lastElement.parentNode ? lastElement.parentNode : undefined;
        pageElement = getPageElement(elements);
        if (!pageElement && insert_ && insert_.parentNode) {
          pageElement = document.createElement("span");
          // insert_.parentNode.prepend(pageElement);
          // Put the page element right before the first element. The first element may not necessarily be the first child element of the parent, so we can't use insert_.parentNode.prepend(pageElement)
          const firstElement = elements[0];
          firstElement.parentNode.insertBefore(pageElement, firstElement);
        }
        calculateOffset(elements);
        // resizeMedia("element", document.body);
        appendFinally("element", pageElement, "prepareFirstPage");
        break;
      case "media":
        const media = document.createElement("div");
        media.style = MEDIA_STYLE;
        document.body.querySelectorAll(":scope > *").forEach(element => media.appendChild(element));
        document.body.appendChild(media);
        resizeMedia("media", media);
        appendFinally("media", media, "prepareFirstPage");
        break;
      case "none":
        appendNone("prepareFirstPage");
        break;
    }
  }

  /**
   * Appends the loading element while Infy is loading (fetching) the next page. There is only one loading element that
   * we created in the DOM, so we reuse it and simply "re-append" it to the bottom of the document.
   *
   * @private
   */
  function appendLoading() {
    console.log("appendLoading() - items.scrollLoading=" + items.scrollLoading);
    try {
      if (items.scrollLoading && loading && loading.style) {
        loading.style.display = "block";
        // Each time this append is repeated, the loading div simply moves to the bottom of the body (it does not duplicate the loading div)
        document.body.appendChild(loading);
      }
    } catch(e) {
      console.log("appendLoading() - exception caught:" + e);
    }
  }

  /**
   * If enabled, appends a page divider for each page that was appended.
   * The page divider consists of the infinity svg icon, page number, and a horizontal line above it (except in tables).
   *
   * @private
   */
  function appendDivider() {
    console.log("appendDivider() - instance.scrollDivider=" + instance.scrollDivider);
    try {
      if (instance.scrollDivider === "yes" || (instance.scrollDivider === "element" && instance.scrollAppend === "element")) {
        // The divider elements' style omits display intentionally because this is variable depending on tag and tag2
        // TODO: Add a default display to tag and tag2 when not div
        const align = items.scrollDividerAlign === "left" ? "left" : items.scrollDividerAlign === "right" ? "right" : "center";
        const style = "visibility: visible; float: none; clear: both; margin: 0 auto; text-align: " + align + "; ";
        // Before we added the Page Divider Align Option, it was: const style = "visibility: visible; float: none; clear: both; text-align: center; margin: 0 auto; ";
        let tag = "div";
        let tag2 = "div";
        // The divider tag is dependant on what the element_ is (e.g. div, ul, table)
        if (instance.scrollAppend === "element" && insert_ && insert_.parentNode && insert_.parentNode.nodeName) {
          const nodeName = insert_.parentNode.nodeName.toUpperCase();
          switch(nodeName) {
            case "DL":                  tag = "dt"; tag2 = "dd"; break;
            case "OL":    case "UL":    tag = "li";              break;
            case "TABLE": case "TBODY": tag = "tr"; tag2 = "td"; break;
            case "THEAD":               tag = "tr"; tag2 = "th"; break;
          }
        }
        console.log("appendDivider() - divider tag=" + tag + ", divider.container tag=" + tag2);
        // If this is a table row, must calculate colspan before we re-create the divider
        const colSpan = tag === "tr" ? calculateColSpan() : undefined;
        divider = document.createElement(tag);
        // Note: Do not apply a className to the divider. Some websites, like Bing Search, remove the divider due to having a className
        divider.id = "infy-scroll-divider-" + (pages.length + 1);
        // Divider style only adds border-top and padding/margin if not a table row (tr)
        divider.style = style + (tag !== "tr" ? "border-top: 1px solid " + COLOR + "; padding: 4px 0 0 0; margin: 1rem auto; width: 100%;" + (tag === "div" ? " display: block;" : tag === "li" ? "list-style: none;" : "") : "");
        const container = document.createElement(tag2);
        container.style = style + (tag2 === "div" ? "display: block;" : "");
        if (colSpan) {
          container.colSpan = colSpan;
        }
        const anchor = document.createElement("a");
        anchor.href = instance.url;
        anchor.style = style + "display: inline; text-decoration: none; color:" + COLOR + ";";
        if (items.scrollIcon) {
          const icon = createInfinity("inline", 30, 30, false);
          anchor.appendChild(icon);
        }
        const text = document.createElement("span");
        text.style = style + "display: inline; font-weight: bold; font-style: normal; font-family: 'Roboto', Arial, sans-serif; font-size: 16px; letter-spacing: initial; vertical-align: middle; color:" + COLOR;
        text.textContent = "Page " + (pages.length + 1);
        anchor.appendChild(text);
        container.appendChild(anchor);
        divider.appendChild(container);
        if (instance.scrollAppend === "element") {
          insert_.parentNode.insertBefore(divider, insert_);
        } else {
          document.body.appendChild(divider);
        }
      } else {
        // If the append mode changed and we are no longer appending a divider, we need this else to know to change the point to the element
        divider = undefined;
      }
    } catch(e) {
      console.log("appendDivider() - exception caught:" + e);
    }
  }

  /**
   * TODO: This function isn't currently being used, but it ought to be. Its purpose is to display a message on the page in case there is an error encountered.
   *
   * @param message the message to display
   * @private
   */
  function appendMessage(message) {
    console.log("appendMessage() - message=" + message);
    const div = document.createElement("div");
    div.style = "position: fixed; top: 0; left: 0;";
    div.textContent = message;
    document.body.appendChild(div);
    setTimeout(function() {
      document.body.removeChild(div);
    }, 10000)
  }

  /**
   * Gets all elements (includes both Element and Text Nodes) via the document.createTreeWalker() function.
   *
   * @param root       the root element to walk against (e.g. document.body)
   * @param whatToShow (optional) the filtered elements to show (e.g. To only show Elements: NodeFilter.SHOW_ELEMENT)
   * @see https://stackoverflow.com/a/44516001
   * @private
   */
  function getElementsByTreeWalker(root, whatToShow) {
    const walker = document.createTreeWalker(root, whatToShow);
    const elements = [];
    // Note: The walker's first node is the root, so we can safely start iterating with a leading nextNode()
    while (walker.nextNode()) {
      elements.push(walker.currentNode);
    }
    return elements;
  }

  /**
   * Gets the array of elements in Append Element mode using the pageElement rule.
   * Note: This is public so Infy.buildInstance() can call it when determining if this is a database URL.
   *
   * @param currentDocument   the document to use when querying or evaluating the array of elements
   * @param scrollElementType the type of rule to query or evaluate (selector or xpath)
   * @param scrollElementRule the actual CSS Selector or XPath rule
   * @param withDetails       whether to include the details object or not
   * @returns {[]} the array of elements
   * @public
   */
  function getElements(currentDocument, scrollElementType = instance.scrollElementType, scrollElementRule = instance.scrollElementRule, withDetails) {
    console.log("getElements() - scrollElementType=" + scrollElementType + ", scrollElementRule=" + scrollElementRule);
    let elements = [];
    // Stores the exception or error message in order to return it back to the user for feedback (e.g. invalid selector)
    const details = {};
    try {
      if (scrollElementType === "selector") {
        const result = currentDocument.querySelectorAll(scrollElementRule);
        elements = Array.from(result);
      } else if (scrollElementType === "xpath") {
        // TODO: Investigate XPath resolver. Is null always OK?
        const result = currentDocument.evaluate(scrollElementRule, currentDocument, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        if (result && result.snapshotLength > 0) {
          for (let i = 0; i < result.snapshotLength; i++) {
            elements.push(result.snapshotItem(i));
          }
        }
      }
    } catch(e) {
      console.log("getElements() - error getting elements using rule, error=" + e);
      details.error = e.message;
    }
    return withDetails ? [elements, details] : elements;
  }

  /**
   * Gets the insertion point in the Append Element mode. We first check using the insertBefore rule (if supplied), and
   * then fall back to checking the elements.
   *
   * Note: The insertBefore rule is completely optional and was only found to be used in ~1% of all Database records. It
   * should only be used on the first page (original document).
   *
   * @param elements                the page elements to use to get the insert element from
   * @param useInsertRule           (optional) if true, attempts to use the insert before rule
   * @param scrollElementType       (optional) the type of rule to query or evaluate for the insert before rule (selector or xpath)
   * @param scrollElementInsertRule (optional) the insert before rule to use to get the insert element
   * @param withDetails             (optional) if true, returns extra details, such as the source of the insert element
   *
   * @returns {*} the insert element or the insert element with source
   * @private
   */
  function getInsertElement(elements, useInsertRule, scrollElementType = instance.scrollElementType, scrollElementInsertRule = instance.scrollElementInsertRule, withDetails) {
    console.log("getInsertElement() - scrollElementType=" + scrollElementType + ", scrollElementInsertRule=" + scrollElementInsertRule);
    let insertElement;
    // TODO: i18n out the details
    let details = "";
    // Check insertBefore Rule only on first page on original document (wrap in try/catch in case there's a problem to fallback to normal insert point)
    try {
      if (scrollElementInsertRule && useInsertRule) {
        if (scrollElementType === "selector") {
          insertElement = document.querySelector(scrollElementInsertRule);
        } else {
          insertElement = document.evaluate(scrollElementInsertRule, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        }
        details = "derived from the insert before rule";
      }
    } catch(e) {
      console.log("getInsertElement() - error checking insertBefore rule. error=" + e);
      details = e.message;
    }
    // If no insert element found using the insert before rule, set insertion point using the last element
    if (!insertElement && elements && elements.length > 0) {
      try {
        const lastElement = elements[elements.length - 1];
        if (lastElement.nextSibling) {
          insertElement = lastElement.nextSibling;
          details = "the last element's next sibling";
        } else {
          // Don't modify the DOM if only requesting details! (e.g. Popup checking...) Just return the lastElement so we get the parent from it
          if (withDetails) {
            insertElement = lastElement;
          } else {
            // TODO: Investigate if we can create an element span, as that lets us use getBoundingClientRect
            insertElement = lastElement.parentNode.appendChild(document.createTextNode(" "));
          }
          details = "a new node created by the document";
        }
      } catch(e) {
        console.log("getInsertElement() - error checking lastElement. error= " + e);
        details = e.message;
      }
    }
    console.log("getInsertElement() - details=" + details);
    return withDetails ? [insertElement, details] : insertElement;
  }

  /**
   * Gets and calculates the page element from the elements array, used in the Append Element mode. The page element is
   * the first Node.ELEMENT_NODE in the elements array. It must be a Node.ELEMENT_NODE because it is the element used to
   * observe which page we are in (text or comment nodes can't be used). It should also be 1px or higher so it can be
   * scrolled into view and detected. Finally, the element should have a default position attribute of static (or at
   * least relative) to avoid issues with absolute and fixed elements.
   *
   * Note: This function is also called in prepareFirstPage() to find the first page's pageElement, and also in Append
   * Page mode to get each page's pageElement.
   *
   * @param elements the elements array, of which a page element will be selected from
   * @returns Node.ELEMENT_NODE the page element selected from the elements array
   * @private
   */
  function getPageElement(elements) {
    console.log("getPageElement() - elements.length=" + elements.length);
    let pageElement;
    if (elements && elements.length > 0) {
      // Set the pageElement to the first element node that is 1px or higher and that has a default position of static (it can't be a text or comment node in order to use getClientBoundRect in SL or to observe it in IO)
      // pageElement = elements.filter(e => e && e.nodeType === Node.ELEMENT_NODE && Math.max(e.clientHeight, e.offsetHeight, e.scrollHeight) > 1 && window.getComputedStyle(e).getPropertyValue("position") === "static")[0];
      // Prioritize finding a position node that meets all the requirements, then use the first available height node, then the first available element node
      const elementNodes = elements.filter(e => e && e.nodeType === Node.ELEMENT_NODE);
      const heightNodes = elementNodes.filter(e => Math.max(e.clientHeight, e.offsetHeight, e.scrollHeight) > 0);
      const positionNode = heightNodes.filter(e => window.getComputedStyle(e).getPropertyValue("position") === "static")[0];
      pageElement = positionNode || heightNodes[0] || elementNodes[0];
      // || elements[0] ?
    }
    return pageElement;
  }

  /**
   * Calculates the colSpan of the table (element_). This is only used for the divider in Append Element mode when the
   * divider needs to be a table row (in other words, the parent element_ is a table or tbody).
   *
   * @returns {number} the colSpan of the table (element_)
   * @private
   */
  function calculateColSpan() {
    console.log("calculateColSpan()");
    let colSpan;
    try {
      // If we already have a divider with the container child's colspan, we don't need to calculate the colspan again
      if (divider && divider.children[0] && divider.children[0].colSpan && divider.children[0].colSpan > 0) {
        console.log("calculateColSpan() - colSpan already calculated, using prior divider's colSpan");
        colSpan = divider.children[0].colSpan;
      } else {
        // Else we need to calculate it by looking at each row using the number of cells and their colspan (using the max colSpan found for each row)
        console.log("calculateColSpan() - calculating colSpan for the first time using the table's rows...");
        // TODO: colspan can sometimes be 0 (nonstandard in HTML 5) so change to: cell.colspan || 1?
        colSpan = Math.max(...[...insert_.parentNode.rows].map(row => [...row.cells].map(cell => cell.colSpan).reduce(function(a,b) { return a + b }, 0)));
      }
    } catch(e) {
      console.log("calculateColSpan() - error=" + e);
    }
    if (!colSpan || colSpan <= 0) {
      console.log("calculateColSpan() - no colSpan found, setting colSpan to 1");
      colSpan = 1;
    }
    console.log("calculateColSpan() - colSpan=" + colSpan);
    return colSpan;
  }

  /**
   * Calculates the offset, which is the space in pixels from the insertion point (the bottom of the elements content)
   * to the very bottom of the HTML document. This only needs to be calculated one time, as the offset should never
   * change since this space is never modified.
   *
   * This function is only used in Append Element mode.
   *
   * TODO: Add a way to call this again if the mode changes (e.g. from Page to Element).
   *
   * @param elements the page elements array, of which to calculate offset from
   * @private
   */
  function calculateOffset(elements) {
    const html = document.documentElement;
    const body = document.body;
    const bottom = Math.max(html.clientHeight, html.scrollHeight, html.offsetHeight, body.clientHeight, body.scrollHeight, body.offsetHeight);
    // Check where the insertion point is on the document and find its position. Its position (top) can then be used to calculate the offset
    let insertPosition;
    if (insert_ && insert_.nodeType === Node.TEXT_NODE) {
      const element = convertTextToElement(insert_);
      insertPosition = getElementPosition(element);
      // Take the insert out of the element and back where it was, then remove the element
      if (element && element.parentNode && element.parentNode.insertBefore) {
        element.parentNode.insertBefore(insert_, element);
        element.remove();
      }
    } else {
      insertPosition = getElementPosition(insert_);
    }
    // TODO: Use other values as backup for the difference, such as the parent element's bottom or the elements themselves?
    // const difference = insertPosition.top && insertPosition.top > 0 ? insertPosition.top : bottom * 0.75;
    // 1st Option: Use the insertion point's top position
    let difference = insertPosition.top;
    // 2nd Option: Fall back to calculating the elements' bottom position and use the biggest value
    if (!difference || difference <= 0) {
      console.log("calculateOffset() - no value found from the insert position's top, calculating each element's bottom position ...");
      difference = Math.max(...(elements.filter(e => e.nodeType === Node.ELEMENT_NODE).map(e => getElementPosition(e).bottom)));
    }
    // 3rd Option: OK, we fall back to using the total document height * 0.75
    if (!difference || difference <= 0) {
      console.log("calculateOffset() - no value found from any of the elements' bottom position, calculating the document's bottom * 0.75 ...");
      difference = bottom * 0.75;
    }
    offset = bottom - difference;
    console.log("calculateOffset() - the elements' max bottom position was:" + Math.max(...(elements.filter(e => e.nodeType === Node.ELEMENT_NODE).map(e => getElementPosition(e).bottom))));
    console.log("calculateOffset() - bottom=" + bottom + ", offset=" + offset + ", insertPosition=" + insertPosition.top + ", backup bottom*0.75=" + (bottom * .75) + ", and the value chosen was=" + difference);
  }

  /**
   * Gets an element's position relative to the entire document. We use the getBoundingClientRect() method instead of
   * traversing the offset parent (older algorithm).
   *
   * @param element the element to get the position of
   * @returns {{top: number, left: number}|{top}}
   * @see https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
   * @see https://stackoverflow.com/a/1461143
   * @private
   */
  function getElementPosition(element) {
    let position = { top: 0, bottom: 0, left: 0 };
    try {
      // Commented out the left since it's not needed for our purposes
      const rect = element.getBoundingClientRect();
      // const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      position.top = rect.top + scrollTop;
      position.bottom = rect.bottom + scrollTop;
      // position.left = rect + scrollLeft;
    } catch(e) {
      console.log("getElementPosition() - exception caught, e=" + e);
    }
    console.log("getElementPosition() - position.top=" + position.top + ", position.bottom=" + position.bottom);
    return position;
  }

  /**
   * Converts a text node into a HTML element (namely the insertion point) so that we can use Node.ELEMENT_NODE
   * functions, like getBoundingClientRect in order to calculate the scroll position.
   *
   * @param node the node
   * @returns {HTMLSpanElement|*} the converted element
   * @private
   */
  function convertTextToElement(node) {
    console.log("convertTextToElement()");
    try {
      if (node.nodeType === Node.TEXT_NODE) {
        const element = document.createElement("span");
        node.parentNode.insertBefore(element, node);
        element.appendChild(node);
        return element;
      }
    } catch(e) {
      console.log("convertTextToElement() - exception caught, e=" + e);
    }
    return node;
  }

  /**
   * Resizes all media elements (like images and videos) by scaling them down to the window's width.
   *
   * Note: This function is called to resize images to fit the screen before calculating the document's height in the
   * following append modes: iframe.
   *
   * TODO: Test append element mode more before including it here with the other modes
   *
   * @param mode      the append mode
   * @param container the parent container element whose children should be resized
   * @param elements  the specific elements to resize
   * @private
   */
  function resizeMedia(mode, container, elements) {
    console.log("resizeMedia() - mode=" + mode + ", container=" + container + ", container.children.length=" + (container && container.children ? container.children.length : "") + "elements.length=" + (elements ? elements.length : ""));
    try {
      switch(mode) {
        case "page":
        case "iframe":
          // page and iframe modes exit if resize media enabled is false (media still needs to do work here though)
          if (!items.resizeMediaEnabled) {
            return;
          }
          // Get the actual window associated with this container's elements (iframes have their own windows)
          const gwindow = container && container.ownerDocument && container.ownerDocument.defaultView ? container.ownerDocument.defaultView : window;
          // Depending on if we have a container or not to query against, filter the elements to only media elements TODO: Include videos as well?
          if (!elements) {
            elements = [...container.querySelectorAll("img")];
          } else {
            elements = elements.filter(el => el && el.nodeName && el.nodeName.toUpperCase() === "IMG");
          }
          elements.forEach(el => {
            el.style.objectFit = "scale-down";
            const maxWidth = gwindow.getComputedStyle(el).maxWidth;
            console.log("resizeMedia() - window.getComputedStyle().maxWidth=" + maxWidth);
            // Note: We only set the max-width to 100% if there isn't one already set (e.g. it could be that an element already has a smaller max-width set, and we don't want to disturb this)
            // TODO: This still sometimes set some images smaller than they have to be, e.g. images that are occupying a space bigger than 100% in tables
            if (!maxWidth || maxWidth.toLowerCase() === "none") {
              el.style.maxWidth = "100%";
            }
          });
          break;
        case "media":
          // Firefox sets "position: absolute" on img roots, so we always reset it to "position: initial"
          const style = items.resizeMediaEnabled ? "object-fit: scale-down; max-width: 100%; max-height: 100vh; position: initial;" : "position: initial;";
          container.querySelectorAll("img, video").forEach(el => el.style = style);
          break;
      }
    } catch(e) {
      console.log("resizeMedia() - error=" + e);
    }
  }

  /**
   * Creates the infinity svg icon. This is used for the loading animation, page overlay, and page divider.
   *
   * Generated by loading.io
   *
   * @param display       the svg's display style
   * @param width         the svg's width style
   * @param height        the svg's height style
   * @param animated      (boolean) true if the infinity icon should be animated, false if not
   * @returns {SVGSVGElement} the svg element
   * @see https://loading.io
   * @private
   */
  function createInfinity(display, width, height, animated) {
    console.log("createInfinity() - display=" + display + ", width=" + width + ", height=" + height + ", animated=" + animated);
    let svg;
    try {
      const ns = "http://www.w3.org/2000/svg";
      svg = document.createElementNS(ns, "svg");
      svg.setAttribute("width", width);
      svg.setAttribute("height", height);
      svg.setAttribute("viewBox", "0 0 100 100");
      svg.setAttribute("preserveAspectRatio", "xMidYMid");
      svg.setAttribute("style", "display: " + display + "; margin: auto; shape-rendering: auto; vertical-align: middle; visibility: visible; width: initial; height: initial;");
      const path = document.createElementNS(ns, "path");
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", COLOR);
      path.setAttribute("stroke-width", "15");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("d", "M24.3 30C11.4 30 5 43.3 5 50s6.4 20 19.3 20c19.3 0 32.1-40 51.4-40 C88.6 30 95 43.3 95 50s-6.4 20-19.3 20C56.4 70 43.6 30 24.3 30z");
      path.setAttribute("style", "transform:scale(0.77); transform-origin:50px 50px;");
      if (animated) {
        path.setAttribute("stroke-dasharray", "205.271142578125 51.317785644531256");
        const animate = document.createElementNS(ns, "animate");
        animate.setAttribute("attributeName", "stroke-dashoffset");
        animate.setAttribute("repeatCount", "indefinite");
        animate.setAttribute("dur", "2s");
        animate.setAttribute("keyTimes", "0;1");
        animate.setAttribute("values", "0;256.58892822265625");
        path.appendChild(animate);
      }
      svg.appendChild(path);
    } catch(e) {
      console.log("createInfinity() - error=" + e)
      svg = document.createTextNode(' ');
    }
    return svg;
  }

  /**
   * Creates the optional overlay that is fixed on the page. The overlay shows the current page # / total page # and is
   * updated as the user scrolls.
   *
   * Note: This function is only called one time when the instance is started for the very first time.
   *
   * @private
   */
  function createOverlay() {
    // TODO: Should we not show the overlay when scroll append is none (i.e. button click)?
    if (instance.scrollOverlay && document && document.body) {
      overlay = document.createElement("div");
      overlay.id = "infy-scroll-overlay";
      overlay.style = "all: initial; position: fixed; top: 0; right: 0; padding: 8px; z-index: 2147483647; background: white;";
      if (items.scrollIcon) {
        const icon = createInfinity("inline", 30, 30, false);
        overlay.appendChild(icon);
      } else {
        // By always appending a first child, we can always assume the text below is going to be overlay.children[1] when we go and later update it
        overlay.appendChild(document.createElement("span"));
      }
      const text = document.createElement("span");
      text.style = "vertical-align: middle; font-family: 'Roboto', Arial, sans-serif; font-size: 16px; font-weight: bold; font-style: normal; color:" + COLOR;
      text.textContent = "Page " + instance.currentPage + " / " + instance.totalPages;
      overlay.appendChild(text);
      if (items.debugEnabled) {
        const text2 = document.createElement("span");
        text2.style = "display: block; margin-top: 4px; vertical-align: middle; font-family: 'Roboto', Arial, sans-serif; font-size: 10px; font-weight: bold; font-style: normal; color: #6200ee";
        text2.textContent = "Debug Mode - Initialized";
        overlay.appendChild(text2);
      }
      document.body.appendChild(overlay);
    }
  }

  /**
   * Creates the loading div with the animated infinity icon, initially set to display:none and re-appended after each
   * new page has been added.
   *
   * Note: This function is only called one time when the instance is started for the very first time.
   *
   * @private
   */
  function createLoading() {
    loading = document.createElement("div");
    loading.id = "infy-scroll-loading";
    // TODO: In Debug Mode, we will show a "position:fixed" loading element so it is always visible in the bottom-right. This might be annoying to the user, which is why we don't do this by default.
    if (items.debugEnabled) {
      loading.style = "all: initial; display: none; position: fixed; bottom: 0; right: 0; padding: 8px; z-index: 2147483647;";
      const icon = createInfinity("block", 30, 30, true);
      loading.appendChild(icon);
    } else {
      loading.style = "all: initial; display: none; maxWidth: 100%; margin: 0 auto; z-index: 2147483647;";
      const icon = createInfinity("block", 150, 150, true);
      loading.appendChild(icon);
    }
  }

  /**
   * This function is this content-script's entry point. It runs on every page request and determines if the
   * extension should start itself or not. It initializes the storage items and instance on the page.
   *
   * Note: This function only runs one time.
   *
   * @returns {Promise<void>}
   * @private
   */
  async function init() {
    console.log("init()");
    items = await Infy.getItems();
    instance = await Infy.buildInstance({ id: 0, url: window.location.href }, items);
    console.log("init() - instance=");
    console.log(JSON.stringify(instance));
    if (instance.enabled) {
      start();
      chrome.runtime.sendMessage({greeting: "setBadge", badge: "on", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
    }
  }

  /**
   * This function is only called when the extension wants to "start" running on this page.
   * This will create some of Infy Scroll's one-time only elements (like the overlay and loading) for the very first time and actually add the scroll detection.
   *
   * Note: This function typically only runs one time. The difference between it and init() is that init() runs on each
   * page request, whereas start() only runs when the extension should be "started" (enabled) for the very first time.
   *
   * @private
   */
  function start() {
    console.log("start()");
    if (!instance.started) {
      instance.started = true;
      // TODO: Is the enabled needed because we might start via shortcuts? The Popup normally sets this to true after clicking Accept
      instance.enabled = true;
      scrollListener = throttle(scrollDetection, items.scrollDetectionThrottle);
      createOverlay();
      createLoading();
      prepareFirstPage();
    }
    // Add scroll detection if instance is starting again after stopping (outside the if instance.started check)
    addScrollDetection();
    // Re-show the overlay if the instance is starting again after stopping (outside the if instance.started check)
    if (overlay && overlay.style && overlay.style.display) {
      overlay.style.display = "initial";
    }
  }

  /**
   * This function is called when the extension wants to "stop" running on this page. This code handles all non-instance
   * specific stopping logic, such as removing the scrollDetection and hiding the overlay and loading elements.
   *
   * This will put the instance in a disabled or stopped state in case the user decides to turn the extension back on
   * before refreshing the page.
   *
   * @public
   */
  async function stop() {
    console.log("stop()");
    removeScrollDetection();
    if (overlay && overlay.style) {
      overlay.style.display = "none";
    }
    if (loading && loading.style) {
      loading.style.display = "none";
    }
    // We MUST get the updated on/off state on this page's storage items cache
    items = await Promisify.getItems();
    // Instance Business Logic: This was
    if (instance.autoEnabled) {
      Auto.stopAutoTimer(instance, "stop");
    }
    // For callers like popup that still need the instance, disable all states and reset auto, multi, and urls array
    instance.enabled = instance.multiEnabled = instance.autoEnabled = instance.autoPaused = instance.autoRepeat = instance.shuffleURLs = false;
    // instance.started will ALWAYS remain true, do not reset it to false in the case the user re-enables the extension on this page
    instance.autoTimes = instance.autoTimesOriginal;
    instance.multi = {"1": {}, "2": {}, "3": {}};
    instance.multiCount = instance.autoRepeatCount = 0;
    instance.urls = [];
    // Scroll Instance Cleanup ... TODO: Why was this current page change needed?
    // instance.currentPage = instance.totalPages;
    chrome.runtime.sendMessage({greeting: "setBadge", badge: "off", temporary: true}, function(response) { if (chrome.runtime.lastError) {} });
  }

  /**
   * Listen for requests from chrome.tabs.sendMessage (Extension Environment: Background / Popup)
   * Note: Every request should be responded to via sendResponse. Otherwise we introduce an unnecessary delay in waiting
   * for the response.
   *
   * @param request      the request object, which contains a greeting indicating what the request is
   * @param sender       the sender object (contains other information like tab)
   * @param sendResponse the response wrapper
   * @returns {Promise<void>} the response
   * @private
   */
  async function messageListener(request, sender, sendResponse) {
    console.log("chrome.runtime.onMessage() - request.greeting=" + request.greeting);
    let response = {};
    switch (request.greeting) {
      case "getInstance":
        response = getInstance();
        break;
      // From Popup (Accept Button)
      case "start":
        // Store the current page before setting the instance
        const currentPage = instance.currentPage;
        // This is a bit hacky, but if the user clicks Accept in the Popup, we must make sure our copy of the storage items is updated to be on. There should never be a use-case when items is off if this message is being sent
        items.on = true;
        setInstance(request.instance);
        start();
        // Sometimes after the Popup is setting the instance again (e.g. to add Auto after being enabled), isLoading is in a strange state of true
        instance.isLoading = false;
        // Popup sometimes has out of date values for the current page and total pages
        instance.currentPage = currentPage;
        instance.totalPages = pages.length;
        break;
      case "stop":
        stop();
        break;
      case "performAction":
        Action.performAction(request.action, request.caller, instance, items, undefined, document_);
        break;
      case "checkNextPrev":
        response = NextPrev.findNextPrevURL(request.type, request.selector, request.xpath, request.attribute, request.keywordsEnabled, request.keywords, instance.decodeURIEnabled, instance.debugEnabled, document_);
        break;
      case "checkScrollElement":
        const elements = getElements(document_, request.scrollElementType, request.scrollElementRule, true);
        const insert = getInsertElement(elements[0], true, request.scrollElementType, request.scrollElementInsertRule, true);
        const parent = insert[0] ? insert[0].parentNode : undefined;
        response = { found: (elements[0].length > 0 && !!insert[0] && !!parent), elementsLength: elements[0].length, error: elements[1].error, insertDetails: insert[1], parentNode: parent ? parent.nodeName : ""};
        break;
      case "checkButton":
        // Send an object as the 2nd parameter to the button function to simulate an instance
        response = Action.button("popup", { buttonType: request.buttonType, buttonRule: request.buttonRule, buttonMethod: request.buttonMethod });
        break;
      case "addAutoListener":
        Auto.startAutoTimer(instance, request.caller);
        break;
      case "incrementDecrementValidateSelection":
        response = IncrementDecrement.validateSelection(request.instance.selection, request.instance.base, request.instance.baseCase, request.instance.baseDateFormat, request.instance.baseRoman, request.instance.baseCustom, request.instance.leadingZeros);
        break;
      case "incrementDecrementPrecalculateURLs":
        response = IncrementDecrementArray.precalculateURLs(request.instance);
        break;
      case "addSave":
        response = await Saves.addSave(request.instance);
        break;
      case "deleteSave":
        Saves.deleteSave(request.id, request.url, request.writeToStorage);
        break;
      case "command":
        // Allow all commands if the instance is enabled or the command is off, else if down start the instance
        if (request.action === "off") {
          if (items.on) {
            Action.performAction(request.action, request.caller, instance, items);
          }
        } else if (instance && instance.enabled) {
          Action.performAction(request.action, request.caller, instance, items, undefined, document_);
        } else if (request.action === "down") {
          start();
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "on", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
        }
        break;
    }
    sendResponse(response);
  }

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) { messageListener(request, sender, sendResponse); if (request && request.async) { return true; } });

  console.log("scroll.js content script executed");

  init();

  // Return Public Functions
  return {
    getInstance: getInstance,
    setInstance: setInstance,
    getPages: getPages,
    setPages: setPages,
    getDocument: getDocument,
    getInsert: getInsert,
    getElements, getElements,
    append: append
  };

})();