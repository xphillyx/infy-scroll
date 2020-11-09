- [Report a Problem](#report-a-problem)
- [Getting Started](#getting-started)
- [AutoPagerize Database](#setting-up-the-autopagerize-database)
- [Private Windows Local Files](#supporting-private-incognito-windows-and-local-files)
- [Images Not Loading](#images-not-loading)
- [Heads up! Infy is already...](#heads-up-infy-is-already-activated)
- [Turning Infy off and on](#turning-infy-off-and-on)
- [Actions](#actions)
- [Append Modes](#append-modes)
- [Auto](#auto)
- [Multi Incrementing](#multi-incrementing)
- [Date Time Incrementing](#date-time-incrementing)
- [Error Skipping](#error-skipping)
- [Shuffle URLs](#shuffle-urls)
- [Bases and Custom Bases](#bases-and-custom-bases)

# Infy Scroll Help Guide
<br>

<img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/app/infy.png" height="450" align="left" title="Infy">

## Report a Problem
Is something not working right, or is there a feature that you'd like to see in Infy?
***Please, before leaving a low rating or review***, email me at the address below or [open an issue](https://github.com/roysix/infy-scroll/issues) on GitHub. I'll be notified about it immediately and reply to you with a fix as soon as I can!

<img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/app/ea.png" width="180" valign="bottom">
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

## Getting Started
The first couple things you will want to do after adding Infy are to:
1. Setup the AutoPagerize Database
2. Save a few URLs **(Optional)**
3. Allow Access to Incognito/Private Windows or Local File Access **(Optional)**

## Setting Up the AutoPagerize Database
After you install Infy, it should automatically download the AutoPagerize Database, allowing it to work out of the box on thousands of websites. You can then proceed to setting the single-most important setting in Infy:

#### The Most Important Setting: "Auto-activate on all Database URLs"
The single-most important setting in Infy Scroll is that little itty bitty checkbox called `Auto-activate on all Database URLs`, which is checked on by default. This controls if Infy should activate on all those thousands of Database URLs by default, and how you filter the URLs. Depending on how it is checked, you will have two types of filters: a blacklist or a whitelist.

#### Database Blacklist ("Allow all Database URLs except these ones...")
When you have the `Auto-activate` checkbox checked, you'll have a `Database Blacklist.` This lets you allow all URLs by default, but specify a small "blacklist" of URLs that Infy should never auto-activate on. For example, if you like Infy to auto-activate on all URLs, but there's just a few certain ones you definitely don't want it to activate on, you should use this option. Simply enter the list of URLs in your Blacklist and Infy will never activate on them. This is useful for entering in sites that have outdated Database settings, or where the websites no longer work right in AutoPagerize mode (e.g. missing images).

#### Database Whitelist ("Disallow all Database URLs except these ones...")
When you uncheck the `Auto-activate` checkbox, you'll instead have a `Database Whitelist`. This lets you disallow all URLs by default, but specify a small "whitelist" of URLs that Infy is allowed to auto-activate on. For example, if you wanted Infy to only auto-activate on Google Search (and nothing else), you could just enter `google.com/search` in your Database Whitelist, and Infy will only activate on Google Search. Or you could enter nothing in the whitelist, and Infy simply won't activate on any Database URL whatsoever.

#### Database Auto-Update Schedule
Infy lets you specify how often it should auto-update the database, from 1-7 Days. It's recommended to keep this at 1 or 2 days, as websites can change their settings at any time. You can set it to 0 to disable auto-updating.

## Saving Your First URLs
If there's a website that's not supported by the AutoPagerize Database, or if you want to override a Database URL with your own settings, you can manually save it. This lets Infy remember the settings you saved and auto-activate using those settings. Saved URLs always have higher priority over Database URLs.

Infy lets you save your own custom URLs in two ways:
1. `Saved URLs` (More Common) - This lets you save Custom Site-Specific Settings
2. `Whitelist` (Less Common) - This list of URLs use's Infy's Default Settings

#### Saved URLs
You can save URLs by clicking the Heart Button in the top-right corner of Infy's Window. You can then enter the URL to save, and choose between three types:
1. `Pattern` - Matches a URL against *anything* you enter. For example, if you just entered the word `google`, then any URL that has the word `google` in it will match. For most URLs, you want to be as specific as possible, but trim off some parts of the actual URL you are on so that it will auto-activate on multiple URLs that use the same pattern. Normally, this means trimming off URL parameters like search terms, and just entering the domain followed by a few subdirectories/paths in the URL. For example, if you wanted to save a URL pattern for Google Search, you would want to save `https://www.google.com/search` and not `https://www.google.com/search?q=my-search-term`.
2. `Regular Expression` - Like pattern, except this is just using a regular expression to match against, giving you greater flexibility. You must escape certain characters like the dots in URLs with backslash characters, e.g. `\.com`
3. `Exact` - This is the least commonly used option and is only used to match an exact URL (single URL) or, more commonly, when using Increment URL or Decrement URL actions and when you manually changed the selection in the URL to increment. In the latter case, Infy will actually remember the URL as a "pattern" and ignore the selection you selected, so it will match against multiple URLs. For example, say you wanted to save a URL like `https://www.example.com/2/page=1` and Infy pre-selected the 1, but you wanted to increment the 2 instead. You can paste in the URL exactly like this, and Infy will know that it should auto-activate on any URL that is like `https://www.example.com/?/page=1` where the `?` can be any number.

Important: In order to actually save the URL, you must click the `Yes` in the dialog and then also click the `Accept` Button to finalize the save.

#### Whitelist
Don't need to save each URL individually with its own settings? You can go into Infy's Options under `SAVES` and check the `Whitelist Checkbox` to enable this. The URLs in your Whitelist can be full URLs like `https://www.google.com/search` or even shortened URLs like `google.com/search`. Just note that Infy will activate on any URL that matches what you enter!

## Supporting Private (Incognito) Windows and Local Files
If you want Infy to work in Private / Incognito Windows or on your own local files on your computer (useful for `Append Media` mode), you'll want to go to your Browser's Extension Options. The steps differ depending on the browser you are using:

##### Chrome
1. Navigate your browser to `chrome://extensions`
2. Find **Infy Scroll** in the Extension List and click the **Details** Button
3. Toggle on `Allow in Incognito` or `Allow access to file URLs`

##### Edge
1. Navigate your browser to `edge://extensions`
2. Find **Infy Scroll** in the Extension List and click the **Details** Button
3. Check `Allow in InPrivate` or `Allow access to file URLs`

##### Firefox
1. Navigate your browser to `about:addons`
2. Click **Infy Scroll** and then click the **Details** Tab
3. Check `Run in Private Windows`

## Images Not Loading
By far, the most common problem you'll run across is when image thumbnails or video previews aren't loading in the appended pages. This will almost only happen when the Append Mode is either `Element (AutoPagerize)` or `Page`.

#### The Best Solution - Append Iframe Mode
Although this is a hassle, for now, the best way to solve this is to change the Append Mode to `Iframe`. This will force each appended page to run its scripts and set the images. If that fixes it, you can then Save the URL so it will auto-activate in Iframe mode the next time you visit.

#### The Next-Best Solution - Append Scripts and Styles
Normally when Infy appends pages, it strips out the scripts, noscripts, and styles because they are almost never needed and tend to cause problems. However, on some websites, appending these may actually be helpful in fixing missing images. So give this option a try if you don't want to use the Iframe mode.

Just Note: Appending Scripts and Styles will only apply to the following Append Modes: Page and Element.

#### Introducing Custom Scripts - An Attempt to Fix Broken Images So You Don't Have To
For some popular websites, Infy has some `Custom Scripts` built into it (unique only to Infy Scroll) that will fix the images so you don't have to change the Append Mode to `Iframe` or append the scripts yourself. For example, there are two scripts already included just for Google Search and Bing Search.

If there's a very popular website whose images aren't loading, please feel free to report it to me and I'll try my best to add a custom script for it in the next update!

## "Heads up! Infy is already activated..."
First, if you find this message annoying, you can disable it from ever showing up again by going to `Options` > `UI` > and unchecking the `UI Messages` Checkbox.

If Infy is already activated on a page, and you try clicking the Extension Icon followed by the **Pen Icon** to try and edit the settings, you will see this message indicating that Infy is already activated and that you might not able to make some changes. No worries - you *can* still make a lot of changes, including toggling on `AUTO`. It's just that you should be aware that more substantial changes may be difficult to make. For example, changing the Append Mode or Action may produce unpredictable results, as Infy is already appending pages in a different way and the DOM has already been modified significantly.

That said, the extension will always allow you to click Accept again and make the change, and it might just work out fine.

If the change you are trying to make isn't working, it's recommended that you refresh the page and start with a "clean" slate. However, if Infy auto-activated itself, you are likely on a Database URL with Auto-activate set to on, or you may have already Saved this URL (or Whitelisted it). In this case, you will need to first click the `Red Turn Off Button` in the Controls UI. This will turn off Infy so it won't auto-activate when you refresh the page, allowing you to start with a "clean slate" and make your changes.

## Turning Infy off and on
Infy has a "global" on/off state. This lets you basically turn the extension on/off without having to disable it through your browser. When Infy is off, it will never auto-activate on Saved URLs or Database URLs. This is useful so you can refresh the page and keep it from auto-activating when you don't want it to, without having to delete your saves or uncheck the Database Auto-activate checkbox.

Important Note: When you turn Infy off, **Infy sends a message to all other tabs telling them to stop.** This includes other tabs that may be running in Auto mode. Therefore, think of this as a "global" on/off switch, and not as an individual tab function. (However, when you turn Infy back on, it does not send a message to the other tabs telling them to start again. You'll need to go to the tab and turn it back on again or refresh the page.)

Important Note 2: When you turn Infy off, it will still "remember" its current state of what you were doing on that page. So when you try turning it back on, it will pick up right where you last left off on the last page (except in the case of AUTO)! So, don't be scared of that Red Turn Off Button, and use it when you need to.

#### Turning Infy off
There are three ways to turn Infy off:
1. Click the `Red Turn Off Button` in the Button Controls UI
2. Click the `Toggle Switch` in the `UI` section of Infy's Options
3. Enter the `Off` keyboard shortcut (See the `Shortcuts` section in the Options)

#### Turning Infy on
There's two ways to turn Infy back on:
1. Click the `Accept Button` in the Setup UI
2. Click the `Toggle Switch` in the `UI` section of Infy's Options

## Using Infy Manually
If you decide to use Infy manually (by clicking its toolbar icon), there's basically two components in the UI that you'll be dealing with: Actions and Append Modes:

1. Actions - Lets Infy find the next page
2. Append Modes - How the page should be appended

## Actions
In order to find the next page, Infy features multiple actions at your disposal. Generally, you'll be using either the `Next Link` or `Increment URL` actions most of the time.

1. Next Link
2. Prev Link
3. Increment URL
4. Decrement URL
5. Click Button (Special)
6. URL List (Special)

## Next Link and Prev Link
Finding the next link requires an algorithm. Infy's algorithm first attempts to look at the `Next Rule` (Selector or XPath). If it can't find a link using the rule, it then defaults to looking at the `Next Keywords` (found in Infy's Options Page) and trying to parse the page for a link that has one of those keywords. You can edit the rule in Infy's Window and Infy will re-try to find the next link automatically, giving you total control.

##### Finding the Next Link Rule
1. On the page you are viewing, right click on the link
2. Inspect to go to Developer Tools
3. In Developer Tools, Right-click the HTML link element you found
5. `Copy selector` or `Copy Xpath` to get the rule for the link element. You may want to alter the rule if it seems too verbose/specific

## Increment URL and Decrement URL
Incrementing a URL is fairly straightforward: simply select the part of the URL you want incremented, and Infy will increment it based on the settings you set. The `Base Type` should be `Default` (or `Base 10`) for most numbers, however Infy can increment all sorts of things, from Dates to Roman Numerals and even Custom Alphabets.

## Click Button
If the website you're dealing with doesn't have a next link or incrementable URL, this will be your next-best option. Some websites have an annoying `Load More Button`, and Infy can click that button for you as you scroll. You'll need to provide the rule for the button the same way you did for finding the next link.

##### Finding the Button Rule
1. On the page you are viewing, right click on the button
2. Inspect to go to Developer Tools
3. In Developer Tools, Right-click the HTML button element you found. It's usually going to either be a `button` or `a` element
5. `Copy selector` or `Copy Xpath` to get the rule for the buttonelement. You may want to alter the rule if it seems too verbose/specific

## URL List
Already have a list of URLs you want Infy to append? Simply paste them in the input and Infy will append each one as you scroll down. Just make sure the following requirements are met:
1. The page you are currently on matches the same domain of all the pages in your list. Infy can only append URLs that belong to one domain, and you need to be already on that domain. In other words, your list can't feature URLs from two different domains like `google.com` and `microsoft.com`, it's only one or the other.
2. The URLs must be full URLs and start with a protocol, like `https://`. This is so Infy doesn't get confused and treat your URLs like they're relative URLs. For example, a full URL should look something like: `https://www.google.com/page1`, *not* `www.google.com/page1` or `google.com/page1`.
3. The URLs must be separated by line breaks.

Infy can also auto-append all the URLs if you toggle on `Auto`. In this case, you can put any value in the `Times` input since Infy will automatically use the length of your URL List as the `Times`.

## Append Modes
Infy features multiple append modes:
1. Page
2. Iframe
3. Element (AutoPagerize)
4. Media

## Page
Both Page and Iframe modes are similar and will append the full page (including header and footer). Generally, you should try using the Page append mode first as it's the fastest/simplest option to use. This will simply append the next page's HTML to the existing document as is. However, you may notice some broken HTML or images, in which case you will want to try the Iframe mode instead.

## Iframe
As mentioned, Iframe mode is similar to Page mode and appends the full page. The difference is that the Iframe mode wraps *each* page in its own environment to try and keep the HTML or images from breaking, but it will run slower. If you notice broken HTML or images when using Page mode, you should try Iframe mode instead. If this fixes the issue, consider saving the URL so it always activates in Iframe mode the next time you visit or refresh the page.

#### A Quirk About Iframe Mode (Clicking Links):
If you click a link from one of the appended pages in Iframe mode, that one single appended page will navigate to the linked page, without affecting your other appended pages. In other words, the **entire browser tab you are viewing won't refresh**, so you'll still be able to scroll back up and down and view more appended pages.

However, if the link you clicked on points to a different domain, **you won't see the new page at all.** For example, say you are on `Google Search` and have Iframe mode on. If you click on one of the search result links, and it points to, say, `Amazon.com`, the new Amazon Page won't show up. This is because we can't serve content from two different domains on the same "tab page." If the Google Search link had instead pointed to a page on `Google.com`, the page would load fine.

To combat this click-link behavior, you can right-click the link and have it open in a new tab. This is a little annoying, but it's one of the few compromises in Iframe mode.

## Element (AutoPagerize)
The Element mode basically mimics the AutoPagerize extension. This mode only appends specific elements on the page (like a specific div's child elements or a table's rows) instead of the entire page. This requires you to enter a `Page Element Rule`, but it provides the most seamless appending experience compared to the two other Full Page modes (Page and Iframe).

##### Finding the Page Element Rule
1. Right-click somewhere on the page
2. Inspect to go to Developer Tools
3. In Developer Tools, observe the HTML structure of the page and try to find the "parent" element that contains all the child elements that you want to append. For example, a parent div or table that contains all the child image thumbnails or data rows you want appended
4. Right-click the HTML "parent" element you found
5. `Copy selector` or `Copy Xpath` to get the rule for the parent element. You may want to alter the rule if it seems too verbose/specific
6. You can simply add `> *` (Selector) or `/*` (XPath) to the rule for the parent to target all its child elements

##### Page Element Rule - A Real Example
URL: [https://safebooru.org/index.php?page=post&s=list](https://safebooru.org/index.php?page=post&s=list)

On Safebooru, we'd like to append just the thumbnail image elements. Following the above instructions, we inspected the page and found that the "parent" element containing the child elements with the thumbnail images to be the following Selector and XPath:
- Parent Selector: `#post-list > div.content > div:nth-child(1)`
- Parent XPath: `//*[@id="post-list"]/div[2]/div[1]`

We now have our parent element. Since we simply want all the child elements of the parent, we can simply add the `> *` (Selector) or `/*` (XPath) to the parent rule and get our final page element rule:
- Page Element Rule (Selector): `#post-list > div.content > div:nth-child(1) > *`
- Page Element Rule (XPath): `//*[@id="post-list"]/div[2]/div[1]/*`

##### What About the Insert Before Rule?
The Insert Before rule is completely optional and not something you really need to worry about in most cases. It simply adjusts the insertion point of when the children get inserted into the parent page element. It's useful for keeping some annoying footers/paginated dividers out of view on some websites. However, to give you an idea of how uncommonly used it is, out of all 3,000+ AutoPagerize Database URLs, only about 40 had Insert Before rules written for them (and several of them weren't even working). So, that's only about 1% of all URLs.

## Media
Media mode is for when you are viewing media/image files directly, e.g. the URL ends in `001.jpg` and is pointing directly to the file. This mode can only be used when you are using the following three actions:
1. Increment URL
2. Decrement URL
3. URL List

In other words, the URL must be sequential (either incrementable, or you provide the list yourself). The reason why you can't use Next Link, Prev Link, or Click Button is because those actions need to find an HTML element on the page (a link, or a button), and if you are directly viewing an image, there obviously won't be an HTML element besides the image.

In this mode, Infy will attempt to fetch the next image (e.g. `002.jpg`) and append it directly on the page, below the previous image, and keep doing so as you scroll down

#### Viewing Local Media Files
This mode can also be useful when you are viewing images on your computer locally in a directory. For example, you can navigate to `file:///C:/Users/My/Pictures/001.jpg` in your browser and use Infy's Increment URL action to append all your pictures starting from `001.jpg` to `100.jpg` (or however many you have) all on the same page. Just ensure you have [Allow access to file URLs](#supporting-private-incognito-windows-and-local-files) toggled on in your Browser's Extensions Options for Infy Scroll. You can also use Auto and Slideshow modes while doing this.

## Next Prev Link Algorithm (Rules and Keywords)
Infy's algorithm is designed to try to find the next or prev link first via the Selector or XPath rule, and then fall back to parsing the page using the Keywords. However, this "test" on whether to use the keywords is only done the first time it tries to find the link.

#### An Example
For example, say Infy found the next link using the rule initially (on page 1), and then fails to find the next link using the rule on page 2. Infy **won't** fall back on the keywords in that situation and will give up. **In other words, Infy will only try using Keywords if it failed to find the next page the very first time on page 1** (but it will continue to keep using the keywords on subsequent pages since it knows it failed to do it using the rule on page 1).

After spending several hours testing several websites, I found this strategy to hit that "just right" Goldilocks approach and keep it from being too aggressive.

#### Database URLs
This principle also applies to Database URLs, which are always designed to have an XPath rule to find the next link. You'll never see Infy fall back to using keywords on these URLs.

#### Overriding The Algorithm
That said, you can always override this and have Infy always fall back on Keywords no matter what. You can do this by manually going into Infy's Popup Window and entering the Setup and checking the `Fall back to look for links using the Keywords` checkbox.

## Auto
Toggle on `AUTO` in the bottom-left area of the Window to start an auto-appending session! Pause or resume Auto anytime by clicking the `orange pause/play` button or by entering the Auto Shortcut command.

`Times` is the number of Pages and can be between 1 and 10,000. `Seconds` refers to how long it will wait on the page before appending the next page. You may want to increase the seconds in order to not overburden a website's server.

Infy can also do a `Slideshow Mode` and scroll down to each page automatically. If you want the scrolling effect to be smooth instead of instant, just make sure to switch that in the Options Page before hand.

If `Show Times Left` is checked, the extension's icon badge will show you the `Times` remaining; otherwise it will just display `AUTO`.
Note that when Auto is enabled, you will not see error skipping or other action icon feedback badges (if you have `Debug Mode` enabled in the Options).

## Multi Incrementing
Multi lets you increment up to 3 parts of the URL individually, simultaneously, or in ranges. You can even increment the same selection in multiple ways (for example, different intervals)!
Select the part as normal and optionally adjust the interval or base, then click the Multi `+++` button near Selection.
Repeat for each additional part, then click Accept.
You'll then see a new set of color-coded Increment Decrement buttons allowing you to increment just that one part or simultaneously increment all parts.

Note: You can always reset the multi parts by just clicking on the `+++` button again (after three parts have been selected).

Here are some of the neat things you can do with Multi:

#### Multi Selections (Most Common)
This is the most common use for multi.
Select the different parts in the URL to increment and you will have a set of + - buttons for each selection.
Each pair of buttons will be labeled  by a `1`, `2`, or `3` depending on the order of your selections.

#### Multi Intervals
Select the **same** part multiple times, but change the interval each time before clicking the `+++` button. This will let you have multiple buttons that can increment/decrement the selection by different amounts (e.g. a +1 Button, a +10 Button, and a +100 button)!

#### Multi-Simultaneous Incrementing
A pair of `S` labeled Increment Decrement buttons will appear allowing you to simultaneously increment all the parts together in one click.
If you use Multi with AUTO or the Toolkit or use your regular Increment/Decrement shortcuts, by default all the parts will be incremented simultaneously as well!

#### Multi-Range Incrementing
The most complicated multi function allows you to edit the URL and enter ranges for each selection. This performs a "compounded" increment for each part. This also works with AUTO and the Toolkit.

**Example**

`https://www.google.com/1/1/1`

Say you want to increment all three of the `1`s in this URL in different ranges (2, 3, 4 from left to right).
First, you would edit the URL to be:

`https://www.google.com/[1-2]/[1-3]/[1-4]`

Note that the format is `[selection-times]` (using `[]` bracket characters).
This way you can even use this with non-number objects like dates and custom bases.
For example, a date could be edited to be `[12/25/2018-7]` and would start at 12/25 and go all the way to 12/31 (a total of 7 days).

Next, you would highlight and select each part fully (e.g. `[1-2]`) and click on the `+++` button one by one.
Note that you must finish all your edits to the URL and then start to click the `+++` button to do your selections (do not edit, click, edit, click ...).
Note also that your selections' order matters. You usually want to select them in left-to-right order.
This will perform a compounded increment, such that it starts from 1/1/1 and ends at 2/3/4, performing 2 * 3 * 4 = 24 total increments:

    1/1/1 1/1/2 1/1/3 1/1/4

    1/2/1 1/2/2 1/2/3 1/2/4

    1/3/1 1/3/2 1/3/3 1/3/4

    2/1/1 2/1/2 2/1/3 2/1/4

    2/2/1 2/2/2 2/2/3 2/2/4

    2/3/1 2/3/2 2/3/3 2/3/4



You can use Multi Incrementing with AUTO and the Toolkit to generate links or open tabs. In these modes, it will either do a multi-simultaneous increment or a multi-range increment (if you edited the URL to have ranges).

## Date Time Incrementing
Increment dates and times in URLs by changing the `Base` to `Date Time` and providing a date format that is based on the selection!
The "smallest" part of the date you selected will then be incremented.
For example, if you selected a pattern like month/day/year, then day will be incremented by the interval.

Important: Each part of the date needs to be separated by a non date-format character (like a `/` or a `-`, e.g. `2018/01/25`) or the format needs to contain only fixed-width date formats without any separators (e.g. `20180125`).

*The following formats are variable-width and are **not** allowed without separators: `mmmm`, `Mmmm`, `MMMM`, `m`, `d`, `h`, `i`, `s`,`l`.*

#### Date Selection / Format Examples

**Valid Examples**

| Selection  | Format     |
| ---------  | ---------- |
| 01/25/2018 | mm/dd/yyyy |
| Jan-2018   | Mmm-yyyy   |
| 18_1_25    | yy_m_dd    |
| 20180125   | yyyymmdd   |
| 12:30:05   | hh:ii:ss   |
| 1-25_12:30 | m-d_hh:ii  |

**Invalid Examples**

| Selection   | Format     | Reason                                                                    |
| ----------  | ---------- | ------------------------------------------------------------------------- |
| /01/25/2018 | mm/dd/yyyy | Selection has an unnecessary leading / and does not match format |
| 01-252018   | mm-ddyyyy  | Mixed usage of separators and non-separators between date parts           |
| 1252018     | mddyyyy    | Uses a non fixed-width date part without separators ("m" instead of "mm") |
| Sept-2018   | Mmm-yyyy   | "Sept" not in supported short month names ("Sep" only is)                 |

#### Date Formats
This is a table of all the allowable parts you can use in the format.

| Format | Component   | Presentation | Examples   |
| ------ | ----------- | ------------ | ---------- |
| yyyy   | Year        | 4 Digits     | 2000, 2010 |
| yy     | Year        | 2 Digits     | 00, 10     |
| mm     | Month       | 2 Digits     | 01, 12     |
| m      | Month       | 1-2 Digits   | 1, 12      |
| mmm    | Month       | Short Name Lowercased  | jan, dec |
| Mmm    | Month       | Short Name Capitalized | Jan, Dec |
| MMM    | Month       | Short Name Uppercased  | JAN, DEC |
| mmmm   | Month       | Long Name Lowercased   | january, december |
| Mmmm   | Month       | Long Name Capitalized  | January, December |
| MMMM   | Month       | Long Name Uppercased   | JANUARY, DECEMBER |
| dd     | Day         | 2 Digits     | 01, 31     |
| d      | Day         | 1-2 Digits   | 1, 31      |
| hh     | Hour        | 2 Digits     | 01, 23     |
| h      | Hour        | 1-2 Digits   | 1, 23      |
| ii     | Minute      | 2 Digits     | 01, 59     |
| i      | Minute      | 1-2 Digits   | 1, 59      |
| ss     | Second      | 2 Digits     | 01, 59     |
| s      | Second      | 1-2 Digits   | 1, 59      |
| ll     | Millisecond | 3 Digits     | 001, 999   |
| l      | Millisecond | 1-3 Digits   | 1, 999     |

* For the `yy` format (2 Digit Year), if the year is less than 70, we assume the 2000s (2000 - 2069). Otherwise, we assume the 1900s (1970-1999).

#### Short and Long Month Names
Only the the en-US language is currently supported.

- Jan - January
- Feb - February
- Mar - March
- Apr - April
- May - May
- Jun - June
- Jul - July
- Aug - August
- Sep - September
- Oct - October
- Nov - November
- Dec - December

## Error Skipping
This checks if the next URL will return an HTTP error code (like 404) and increments again, skipping it up to 100 times, or until it finds the next good URL. If an error is encountered, the extension icon will flash with the error code (or flash \"RED\" for redirects). Set it to 0 to disable it. Important: This will make a request to the server each time to check the status code, and setting this value too high might cause the server to issue a \"Too Many Requests\" response. A value of 10 or less should be reasonably OK.

You may notice a minor delay (~1 second) when incrementing with error skipping due to the time it takes to wait for a response from a server.

#### An Error-Skipping Example
You are on page=1 and increment with error skip set to 10. If the next 3 pages (page=2 thru page=4) don't exist, they'll be skipped and you'll be taken to the next valid page, page=5 automatically. If more than 10 consecutive pages don't exist, the extension will "give up" checking since error skip is set to 10, and take you to page=12. You can then manually increment again to repeat the process.

#### Error Skipping: An Important Note!
1. You **must** have Enhanced Mode enabled in the Options to use Error Skipping
2. Some websites may not send an error code and "swallow" it, instead returning HTTP Response Code 200 ("OK"), even while still displaying an error page. Error Skipping won't work on these websites.

## Shuffle URLs
Click the `red crossed-arrows` icon in the upper-right area of the Popup to turn this mode on.
You can turn on Shuffle in Normal, Auto, or Toolkit modes (Shuffle does not work when using Next Prev actions).

Think of this feature like how you would shuffle a deck of cards.
It shuffles the URLs you'll see next.
For example, say you start Auto Incrementing at page=1 with a `Times` of `9`; every page from page=2 to page=10 will be shuffled randomly and you will be guaranteed to see each page only once -- just in a random order.
Here's an example:

    page=5,4,9,10,7,2,8,3,6

Please note that the starting URL (page=1) is not included in the shuffled array; just the incremented URLs.
You can also turn on `Auto Repeat` mode at the same time and it will re-shuffle the URLs after it repeats and goes back to the starting URL. But since the starting URL (e.g. page=1) is not part of the shuffled URLs, you'll always know when it repeats and goes back to the start.

Also, you can adjust the `Shuffle Limit` in the Options to set a max upper bound in Normal Incrementing mode, which will apply in both directions.
For example, a `Shuffle Limit` of `1000` means Infy will pre-calculate and shuffle 500 incremented URLs and 500 decremented URLs (in relation to the starting URL).
In Auto or Toolkit modes, the shuffle limit value is not used since it is simply the Auto `Times` or Toolkit `Quantity` (see the above Auto example).

Infy uses the [Durstenfeld algorithm](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle#The_modern_algorithm) to perform the shuffling in an extremely efficient *O(n)* time.

## Bases and Custom Bases
Bases are the "types" of numbers we can increment. Think of them like different alphabets. Infy can increment all sorts of bases, even your own made-up custom ones. :)

Some common bases are:
- 2 Binary - 0s and 1s
- 8 Octal - 0-7 Was popular, but is not commonly used anymore
- 10 Decimal - 0-9 Our default number system
- 16 Hexadecimmal - 0-9 A-F Used in Hex Colors, Hashing, Cryptography
- 32 Hexatrigesimal - 0-9 A-Z The full alphanumeric alphabet (After 9, it goes to A, then every letter till Z and back to 0)
- Base 62 - 0-9 A-Z a-z Similar to Hexatrigesimal except it also contains lowercase alphabet as well
- Base 64 - Similar to Base 62 except additional characters are added like +/ Extremely popular, Hashing, Cryptography

For a good visual showing bases 2-36, please see the [Table of Bases on Wikipedia](https://en.wikipedia.org/wiki/Table_of_bases).

#### Custom Bases
Change the `Base` to `Custom` and instantly define a custom alphabet to increment!
The alphabet can contain special characters, including !@#$%^&*()_+=-.
You can even use normal alphabets and just exclude certain letters.
The order of characters in the alphabet matters; also the first character is treated like "0" in our decimal number system.

Example:
Say you have defined a 5-character custom `Alphabet` of `aB!9?`. This is how it would look like when you start at `a` and increment with an interval of 1:

    a  B  !  9  ?
    Ba BB B! B9 B?
    !a !B !! !9 !?
    9a 9B 9! 99 9?
    ?a ?B ?! ?9 ??
    
Here are some common bases you can copy/paste into the `Alphabet` input:

Base 62  
`0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`

Base 64 (Standard Non-URL Friendly +/ Version Without = Padding)  
`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`

Base 64 (Modified URL Friendly -_ Version Without = Padding)  
`ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_`