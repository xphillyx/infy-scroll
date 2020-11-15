# Infy Scroll Version History

## TODO (Future Versions)
<b>This is the list of things that will be addressed in future versions of Infy</b>
- Fix false positive "ON" badge for Saved URLs. This will require another boolean as we still "found" the Saved URL, but it shouldn't be "ON"
- Add in the Import/Export Saved URLs feature as suggested by LP. Want to wait a bit on this one because we may want to trim the saves first to only the parameters they need. Maybe when Infy gets out of beta

## Version 0.5
<b>Released on 11/?/2020</b>
- *Consolidated Actions. Combined the Next and Prev actions together and the Increment and Decrement actions together.
- Now displaying the Database URL and Saved URL to the icon titles in the button controls when you hover over them
- Added a way to turn off UI messages when the message appears in the Popup. Now shows OK and Don't show this again
- Added page divider alignment option: left, center, or right alignment
- Added icon option to display or not display the infinity icon in the page divider or overlay
- Better Next/Prev Link finding. Now checking the element's parent and added about 5 more keywords for next/prev icons like `angle-right`
- Fixed Firefox Version's inconsistent horizontal width in the Setup when switching actions (e.g. Next Link / Increment URL and Click Button / URL List) 
- Fixed Firefox Version's Button Controls showing a vertical scrollbar when the button size is really large (100 pixels or more) by increasing the margin around the buttons from 4px to 8px
- Fixed false positive "ON" badge for Database URLs. This was due to not testing the validity of the URL returned from the database's nextLink rule (e.g. it could have been the same URL or an invalid URL). Now calling `NextPrev.findNextPrevURL()` to determine the validity
- Fixed incorrect feedback on the insertion point sometimes being the last element's next sibling (this is because we were actually creating a text node when just performing the check)
- Added a second alternative option in `Scroll.calculateOffset()` to get the bottom in Append Element mode if the insertion point returns 0 using the max value of the elements' bottom position
- Reworked some stats and formatting in the Debug Mode's overlay (line breaks)

## Version 0.4 (Halloween Edition)
<b>Released on 10/31/2020</b>
- Added new "Off" state with an `Off Button`; this replaces the "Clear" (X) Button, which only stopped the current instance on the page. The extension can now be (globally) permanently turned off by clicking Off. It will then never auto-activate again until you click the Accept button in the Window
- Controls/Buttons: Changed the order of the buttons slightly (Down and Up are reversed so Down isn't next to the Turn Off button) and added titles to them so users know what they do
- Replaced the "clear" action/shortcut with "off" and "stop". The name clear was a carryover from URLI's logic and doesn't make sense in Infy at all, when it really just means stop here
- Fixed a bug in the Firefox version's Window. The Window used to always show a horizontal scrollbar when a vertical scrollbar was present (this was fixed by setting overflow property to hidden)  
- Added three separate asynchronous on-demand listeners in Infy's Window that will give immediate feedback and details when editing the Next/Prev Rule, Page Element Rule, or Button Rule inputs (similar to the current Next Prev Link feedback)
- Changed the Element icon from window-maximize to cube. Changed the Database icon from cubes to database.
- Completely rewrote the algorithm in `Scroll.scrolledNearBottomPixels()` when using Append Element mode. We simply use the full document height (bottom) and subtract the fixed offset we calculate at the beginning (e.g. the insertion point). It used to simply try and calculate the parent element's height, but this isn't the correct way to do it
- Append Threshold metric is now tied to the Scroll Detection method. Pixels is now exclusively used in Scroll Listener mode and Pages is now exclusively used in Intersection Observer mode
- If Auto is enabled, the extension will now auto-pause itself every time you click the toolbar icon and open its Window
- Auto Pause Bugfix; there was a rare race condition where it "missed" a pause if you tried to pause it right after the Auto Listener creates the next AutoTimer
- Auto Slideshow Behavior now has its own setting saved in storage that is completely independent of the default Scroll Behavior (instant or smooth)
- A lot of the Auto code (Slideshow especially) has been substantially improved. During Slideshow, I decided to make it flexible and allow the user to go down and up as well. It probably isn't experimental anymore and is more robust now, but need to do more testing to make sure
- Fixed a bug that previously allowed multiple actions to fire before a page is appended (for example, multiple increment actions could happen before the next page got appended). This happened when the user tries to enter too many Down shortcut commands or button presses. We now immediately set the instance.isLoading property to true to guard against this in `Action.performAction()`
- No longer wrapping the first page in Append Page and Append Iframe modes. Infy previously would wrap the first page in a DIV or IFRAME in order to store the page in its pages array
- Internal Code: Removed `Scroll.outerPerformAction()` and refactored that code into `Action.performAction()`. This includes the "down," "up," and "repeat" Scroll-specific logic
- Internal Code: Removed `Scroll.wrapFirstPage()` and refactored it into `Scroll.prepareFirstPage()` and just a basic switch statement
- Internal Code: Now setting enabled state and other properties earlier in `Infy.buildInstance()` instead of waiting to do it in `Scroll.start()`. This avoids having to keep checking if an instance is a Saved URL or Database URL in different parts of the application
- Internal Code: Refactored Append Element/AutoPagerize code into separate and reusable functions: `getElements(), getInsertElement(), getPageElement()`
- Added stats in the Debug Mode's Overlay (e.g. bottom, offset)

## Version 0.3
<b>Released on 10/13/2020</b>
- Replaced all Percentage metrics (Append Threshold, Button) with Pixels from the bottom. Pixels scale perfectly no matter how many pages are on the screen
- Added two new properties: append scripts and append styles. These two options may help in fixing broken HTML or missing images on some websites (similar to Append Iframe mode)
- Added Auto Slideshow Behavior setting (this is transient and not saved to storage; its default value is derived from the Scroll Behavior setting in Options)
- Save URL Dialog: Added note that you must also click Accept to finalize saving the URL

## Version 0.2
<b>Released on 9/10/2020</b>
- Much better integration with AutoPagerize Database. You can now download the database instead of having to input it into a textfield
- Added Database Blacklist and a new Database Whitelist. The list that you use depends on whether you have Auto-activate on all Database URLs checked or not. Note: The Blacklist was named "Database Exclusions" in previous versions
- Database much more space-optimized. It was previously storing everything from the JSON response (including unnecessary data like example URLs); now the extension only stores the 3 or 4 required properties for each Database URL (url, nextLink, pageElement, insertBefore)
- Added Insert Before Rule for Append Element mode (Optional and rarely used 4th parameter for AutoPagerize Database URLs)
- Added new option to turn on/off UI Messages ("Heads up, Infy is already...")
- Fetch now uses the original Document's character encoding instead of always using UTF-8. This was problematic on some sites, especially older Japanese sites that used SHIFT-JIS
- Added xhr() fallback to fetch

## Version 0.1
<b>Released on 8/1/2020</b>
- First release after 5 years of development (Project start date was July 2015)