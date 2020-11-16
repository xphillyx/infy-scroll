/**
 * Infy Scroll
 * @file infy-scroll.js
 * @author Roy Six
 * @license TBD
 */

/**
 * This file is only used in production releases of Infy Scroll. In order to only use one file as the content script on
 * each page load, we concatenate the multiple content scripts into this one file.
 *
 * Update the manifest.json to only reflect infy-scroll.js as the sole content script.
 * Then insert the following scripts in this order:
 *
 * 1. promisify.js
 * 2. saves.js
 * 3. next-prev.js
 * 4. increment-decrement.js
 * 5. auto.js
 * 6. action.js
 * 7. scripts.js
 * 8. infy.js
 * 9. scroll.js
 */