# Infy Scroll
<img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/app/infinity.svg?sanitize=true" width="196" height="196" alt="Infy Scroll" title="Infy Scroll">
<br><br>

<a href="https://chrome.google.com/webstore/detail/infy-scroll/gdnpnkfophbmbpcjdlbiajpkgdndlino" title="Chrome Web Store Download">
  <img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/chrome/ChromeWebStore_Badge_v2_496x150.png" height="64" alt="Chrome Web Store">
</a>  
&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://addons.mozilla.org/firefox/addon/infy-scroll/" title="Firefox Addon Download">
  <img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/firefox/FirefoxAddon_Badge_v2_492x128.png" height="64" alt="Firefox Addon">
</a>
&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://microsoftedge.microsoft.com/addons/detail/infy-scroll/fmdemgjiipojpgemeljnbaabjeinicba" title="Microsoft Edge Extension Download">
  <img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/edge/1024px-Microsoft_Edge_logo_(2019).svg.png" height="64" alt="Microsoft Edge Extension, Icon: By Source, Fair use, https://en.wikipedia.org/w/index.php?curid=62848768">
  Microsoft Edge
</a>

<br><br>
<img src="https://raw.githubusercontent.com/roysix/infy-scroll/master/assets/app/infy.png" height="500" alt="Infy" title="Infy" align="left">

## Important Note
Infy is currently in beta. Unfortunately, this means it might contain a few bugs and it might not work on every website you try it on! But I really want you to be 100% happy with Infy, so if something isn't working right, or if there's a feature you think is missing, please email me and give me a chance to fix it before leaving a low rating/review, and I promise I will.
<br><br><br><br><br><br><br><br><br><br><br><br><br><br>

## About
Infy Scroll is an extension in beta that lets you add customized infinite scrolling to websites. It's also compatible with the AutoPagerize Database, which means it supports thousands of websites automatically. Infy supports 4 different actions and 4 different append modes so you can customize each site's infinite scrolling to how you want it to be. Infy understands both CSS Selector and XPath rules for finding next links. It can also increment URLs and perform special actions, like clicking "Load More" buttons. You can save your settings for each URL and Infy will auto-activate the next time you visit them.

## Features
- 4 Actions: Next Link, Increment URL, Click Button, URL List
- 4 Append Modes: Page (for Simple Websites), Iframe (for Complex Websites, similar to PageZipper's Compatibility Mode), Element (AutoPagerize Mode), and Media (for Images like 001.jpg)
- Auto Mode: Automatically append pages, or use Slideshow Mode with Pause and Repeat
- AutoPagerize Database: Infy can use the AP Database to pre-configure thousands of websites for you automatically
- Save URLs: Infy can save custom site-specific settings and then auto-activate on your favorite URLs
- Custom Scripts: Infy has custom scripts for a few popular websites (such as Google Search) that may fix missing image thumbnails
- Chrome / Edge: Uses 0 Background Memory when inactive
- Firefox: Support for Firefox for Android (Fenix Nightly with Collections Workaround, Some features may not work perfectly)
- Open Source on GitHub
- No Ads, No Tracking, No Bloat

## Help Guide
[View the Help Guide!](https://github.com/roysix/infy-scroll/wiki)

## Version History
[Here's the Version History!](https://github.com/roysix/infy-scroll/blob/master/docs/VERSION.md)

## Mini FAQ

#### Is Infy Scroll like AutoPagerize and PageZipper?
No, they're quite different. AutoPagerize is a great and simple to use extension that relies on a database to work. PageZipper is another great and simple to use extension that can work generically across many websites. Infy is a more complex extension that can work both ways, while featuring more actions and append modes of its own (Infy was primarily developed for scroll incrementing). It can work just like AutoPagerize due to its database support and Append Element mode, and it can work similar to PageZipper due to its generic algorithm and Append Page and Iframe modes. It's also customizable. You can also use both Infy and AutoPagerize/PageZipper simultaneously, and only use Infy for websites that AP or PZ don't support (e.g. incrementing URLs or other such things).

##### Comparison Table
|                   | AutoPagerize | PageZipper | Infy Scroll |
| ----------------- | ------------ | ---------- | ----------- |
| Database Support  | ✔️        |            | ✔️       |
| Works Generically |              | ✔️      | ✔️       |
| Customizable      |              |            | ✔️       |

##### Notes
1. <code>Works Generically</code> means the extension can work without relying on a database.
2. Infy's <code>Element</code> Append Mode is similar to AutoPagerize's Append Mode.
3. Infy's <code>Iframe</code> Append Mode is similar to PageZipper's <code>Compatibility</code> Mode.

#### Why Can't Infy Scroll Execute Custom Scripts (Besides Button Clicks)?
Unfortunately, because Browsers strongly discourage this from a security standpoint. This is easily possible, and something I really wanted to include, but having something like `eval()` or `chrome.tabs.executeScript(code: <CustomScriptString>)` in the public release would likely result in either a rejection or extremely long extension review times (especially when Chrome's Manifest v3 comes out).
**Update:** Infy now includes a `scripts.js` file with hardcoded custom scripts inside of it. This includes scripts for popular websites (like Google Search) that fixes missing images and broken HTML. The script will execute on each new page that is appended. If you'd like to contribute a script for a website, please let me know.

#### Can Infy work on websites that auto-load the next page via AJAX?
It depends, but implementing something that works generically (across many websites) would be extremely difficult without allowing custom scripts for each site. The most Infy can do is click a button for you and rely on the website itself to append the content asynchronously, but if the website *replaces* the previous page with the next page's content, this probably won't be what you're looking for.

## Permissions Justification
- `Read and change all your data on the websites you visit` - Infy needs to request this permission so that its content script can auto-activate on any Saved URL or Database URL you want it to.
- `wedata.net` and `github.io` - Infy needs to request permissions to these domains so it can download and use the AutoPagerize Database.

## Remote Code Policy
Infy Scroll does *not* use any remote code. All code is included locally in the extension package and goes under review before being published.

## Privacy Policy
Infy Scroll does *not* collect or transmit any data from your device or computer. All data is stored locally on your device. Your data is *your* data.

## Credits and Special Thanks
<ul>
  <li>Infy: <a href="https://twitter.com/thejoyfool">Joyfool</a></li>
  <li>Database: <a href="http://wedata.net/databases/AutoPagerize/items">AutoPagerize</a></li>
  <li>UI: <a href="https://material.io/">Material Design</a></li>
  <li>Icons: <a href="https://fontawesome.com/">FontAwesome</a></li>
  <li>Animations: <a href="https://ianlunn.github.io/Hover/">Hover.css</a></li>
  <li>Tooltips: <a href="https://kazzkiq.github.io/balloon.css/">Balloon.css</a></li>
  <li>Dialogs: <a href="https://github.com/mikewest">Mike West</a></li>
  <li>Loading: <a href="https://loading.io/">Loading.io</a></li>
  <li>Code Fragments: <a href="https://stackoverflow.com/">Stack Overflow Users</a></li>
  <li>Contributors: <a href="#">LostPacket</a></li>
</ul>

## Copyright and License
Infy Scroll  
Copyright © 2015-2020 Roy Six  
<a href="https://github.com/roysix/infy-scroll/blob/master/LICENSE">License</a>