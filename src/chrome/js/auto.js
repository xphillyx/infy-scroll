/**
 * Infy Scroll
 * @file auto.js
 * @author Roy Six
 * @license TBD
 */

/**
 * Auto handles all auto-related tasks and is called when Auto is enabled via the Popup. An inner AutoTimer object is
 * maintained that contains the auto state (such as the setTimeout seconds left, and paused/resumed state).
 */
var Auto = (() => {

  /**
   * Variables
   *
   * @param autoTimer the {@link AutoTimer} object
   */
  let autoTimer;

  /**
   * Starts the auto timer for the instance by doing all the necessary start-up work (convenience method).
   *
   * @param instance the instance to start an auto timer for
   * @param caller   the caller asking to start the auto timer
   * @public
   */
  function startAutoTimer(instance, caller) {
    console.log("startAutoTimer() - starting auto timer");
    clearAutoTimeout(instance);
    setAutoTimeout(instance);
    // Set starting badge with either normal "auto" badge or repeat badge if it has repeated at least 1 or more times
    if (instance.autoRepeatCount === 0 || instance.autoBadge === "") {
      chrome.runtime.sendMessage({greeting: "setBadge", badge: "auto", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
    } else {
      chrome.runtime.sendMessage({greeting: "setBadge", badge: "autorepeat", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
    }
  }

  /**
   * Stops the auto timer for the instance by doing all the necessary stopping work (convenience method).
   *
   * @param instance the instance's auto timer to stop
   * @param caller   the caller asking to stop the auto timer (to determine how to set the badge)
   * @public
   */
  function stopAutoTimer(instance, caller) {
    console.log("stopAutoTimer() - stopping auto timer");
    clearAutoTimeout(instance);
    // Don't set the off badge if popup is just updating the instance (ruins auto badge if auto is re-set) or any badge setting if auto repeat is on
    // Do not update the badge if the caller is Scroll.stop(). It always updates the badge on its own whether auto is enabled or not
    if (caller !== "stop") {
      if (caller !== "auto" && !instance.autoRepeat) {
        chrome.runtime.sendMessage({greeting: "setBadge", badge: "off", temporary: true}, function(response) { if (chrome.runtime.lastError) {} });
      } else {
        chrome.runtime.sendMessage({greeting: "setBadge", badge: "default", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
      }
    }
  }

  /**
   * Repeats the instance's auto timer.
   *
   * Auto Repeat Workflow:
   * 1. After auto times reaches 0, AutoListener calls this function with a new deep copy of the instance
   * 2. Auto.repeatAutoTimer() sets autoRepeating to true, sets the instance in Content Script, calls Auto.startAutoTimer()
   * 3. Auto.startAutoTimer() calls Auto.setTimeout()
   * 4. Auto.setTimeout() because autoRepeating is true calls Action.returnToStart()
   * 5. Action.returnToStart() sets autoRepeating to false, resets all the instance properties (including multi, array)
   *
   * TODO: Does this still need to be public? We moved the call to repeat from Action.performAction (stop) to the Auto Listener here
   *
   * @param instance the instance's auto timer to repeat
   * @public
   */
  function repeatAutoTimer(instance) {
    console.log("repeatAutoTimer() - repeating auto timer");
    instance.autoRepeating = true;
    instance.autoRepeatCount++;
    Scroll.setInstance(instance);
    startAutoTimer(instance);
  }

  /**
   * Sets the instance's auto timeout and then performs the auto action after the time has elapsed.
   *
   * @param instance the instance's timeout to set
   * @private
   */
  function setAutoTimeout(instance) {
    autoTimer = new AutoTimer(async function() {
      // If instance is in slideshow mode and auto repeating, return to start; otherwise perform a down action
      if (instance.autoRepeating) {
        Action.performAction("return", "auto", instance);
      } else {
        Action.performAction("down", "auto", instance);
      }
    }, instance.autoSeconds * 1000);
  }

  /**
   * Clears the instance's auto timeout and deletes the auto timer.
   *
   * @param instance the instance's timeout to clear
   * @private
   */
  function clearAutoTimeout(instance) {
    if (autoTimer) {
      autoTimer.clear();
      autoTimer = undefined;
    }
  }

  /**
   * Pauses or resumes the instance's auto timer. If the instance is paused, it resumes or vice versa.
   *
   * @param instance the instance's auto timer to pause or resume
   * @public
   */
  function pauseOrResumeAutoTimer(instance) {
    if (autoTimer) {
      if (!instance.autoPaused) {
        console.log("pauseOrResumeAutoTimer() - pausing auto timer...");
        autoTimer.pause();
        instance.autoPaused = true;
        chrome.runtime.sendMessage({greeting: "setBadge", badge: "autopause", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
      } else {
        console.log("pauseOrResumeAutoTimer() - resuming auto timer...");
        autoTimer.resume();
        instance.autoPaused = false;
        // The small window when the auto timer is repeating (REP), show repeat badge if it's times
        if (instance.autoBadge === "times" && instance.autoRepeating) {
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "autorepeat", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
        } else if (instance.autoBadge === "times" && instance.autoTimes !== instance.autoTimesOriginal) {
          // We always use normal "auto" badge at start even if badge is times
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "autotimes", temporary: false, text: instance.autoTimes + ""}, function(response) { if (chrome.runtime.lastError) {} });
        } else {
          // All other conditions, show the normal auto badge
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "auto", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
        }
      }
      // Update instance.autoPaused boolean state (This is necessary)
      Scroll.setInstance(instance);
    }
  }


  /**
   * The auto listener that fires when Auto is enabled and each time after an action is performed.
   * Decides whether or not to set the autoTimeout based on the instance's current properties.
   * Also decides when it is time to delete the instance when the auto times count has reached 0.
   *
   * @param instance the instance that auto listens for
   * @private
   */
  function autoListener(instance) {
    // TODO: Investigate if we can potentially handle the autoTimes just here instead of in two separate places outside this function
    // // Handles autoTimes in both situations: when autoListener is called: regularly in appendFinally, or after down in slideshow in performAction
    // if (!instance.autoRepeating) {
    //   instance.autoTimes--;
    // }
    console.log("autoListener() - instance.autoTimes=" + instance.autoTimes);
    if (instance.autoEnabled) {
      // If autoTimes is still greater than 0, set the auto timeout, else handle stopping auto normally
      // Note: Remember, the first time Auto is already done via Popup calling setAutoTimeout()
      if (instance.autoTimes > 0) {
        // Clearing the timeout first prevents adding multiple timeouts (e.g. if user manually navigated the auto tab)
        clearAutoTimeout(instance);
        setAutoTimeout(instance);
        // In very rare race situations, the timing of pausing just barely missed registering while the previous AutoTimer was still alive, so we pause again on the new AutoTimer
        if (instance.autoPaused) {
          console.log("autoListener() - rare auto pause race condition, attempting to re-pause it...");
          autoTimer.pause();
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "autopause", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
        }
        // If times badge, update the remaining times badge
        else if (instance.autoBadge === "times") {
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "autotimes", temporary: false, text: instance.autoTimes + ""}, function(response) { if (chrome.runtime.lastError) {} });
        }
      } else {
        // Two possibilities: if auto repeat (slideshow), repeat the auto timer, else stop the auto timer
        // Note: stopping will clearAutoTimeout and removeAutoListener, so we don't have to do it here
        // Action.performAction("stop", "auto", instance);
        // Handle AUTO Repeat
        if (instance.autoRepeat) {
          // Create a new deep copy of the instance for the repeat
          repeatAutoTimer(JSON.parse(JSON.stringify(instance)));
        }
        // Auto has expired normally, return back to enabled/on state (but auto disabled). Do not proceed further to turn off instance
        else {
          stopAutoTimer(instance, "auto");
          instance.autoEnabled = false;
          instance.autoPaused = false;
          instance.autoTimes = instance.autoTimesOriginal;
          Scroll.setInstance(instance);
          chrome.runtime.sendMessage({greeting: "setBadge", badge: "on", temporary: false}, function(response) { if (chrome.runtime.lastError) {} });
        }
        // Update the Popup in case the window is still open
        chrome.runtime.sendMessage({greeting: "updatePopupInstance", caller: "auto", action: "", instance: instance}, function(response) { if (chrome.runtime.lastError) {} });
      }
    }
  }

  /**
   * The AutoTimer that contains the internal timeout with pause and resume capabilities.
   * It also contains a "wait" state to keep it from setting a timeout before the page has fully loaded,
   * if the user checked the "Wait for the page to fully load" checkbox.
   *
   * Note: This function is derived from code written by Tim Down @ stackoverflow.com.
   *
   * @param callback the function callback
   * @param delay    the delay for the timeout
   * @see https://stackoverflow.com/a/3969760
   * @private
   */
  function AutoTimer(callback, delay) {
    let timeout;
    let start;
    let remaining = delay;
    let wait = false;

    this.pause = function() {
      clearTimeout(timeout);
      remaining -= Date.now() - start;
      remaining = remaining < 0 || wait ? delay : remaining;
      console.log("AutoTimer.pause() - timeout=" + timeout + " start=" + start + " delay=" + delay + " remaining=" + remaining + " wait=" + wait);
    };

    this.resume = function() {
      start = Date.now();
      clearTimeout(timeout);
      timeout = wait ? timeout : setTimeout(callback, remaining);
      console.log("AutoTimer.resume() - timeout=" + timeout + " start=" + start + " delay=" + delay + " remaining=" + remaining + " wait=" + wait);
    };

    this.clear = function() {
      clearTimeout(timeout);
    };

    this.setWait = function(wait_) {
      wait = wait_;
    };

    this.resume();
  }

  // Return Public Functions
  return {
    startAutoTimer: startAutoTimer,
    stopAutoTimer: stopAutoTimer,
    pauseOrResumeAutoTimer: pauseOrResumeAutoTimer,
    repeatAutoTimer: repeatAutoTimer,
    autoListener: autoListener
  };

})();