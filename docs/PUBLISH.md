# Publishing Notes for Browsers

## Chrome Permissions Justification
activeTab justification
Required so the Popup can call chrome.tabs.executeScript to execute the content script in situations when the content script hasn't loaded on the page. For example, right after the user installs the extension and using a previously-opened tab, and expecting the extension to work on the page before refreshing it.

storage justification
The storage permission is required to save the user's settings and saved URLs.

Host permission justifications
The <all_urls> host permission is required so the extension's content script can auto-activate on any URL the user wants to save. Since the extension can't know in advance which specific URLs the user wants the extension to auto-activate on, it needs to request the <all_urls> permission. The ability for the extension to auto-activate itself is considered to be extremely important for the vast majority of users who will be using it.

*://wedata.net/* - this host permission is needed in order to fetch and download the AutoPagerize Database containing infinite scroll settings for many websites. The extension makes a request to download the database after being installed.

*://*.github.io/* - this host permission is needed as a backup in the event that wedata.net is down. If the extension catches an exception while fetching the request to wedata.net, it will then make a second request to github.io to get a backup of the AutoPagerize Database containing infinite scroll settings.

## Edge Notes for Certification
This extension adds infinite scrolling to websites. After installing it, it automatically fetchs the AutoPagerize database that contains infinite scrolling settings for many websites. You can then navigate to a website (Bing Search, Google Search, and some other popular sites) and it should automatically start appending the next page as you scroll down. You can also click the extension toolbar icon to add/customize infinite scrolling on sites where the extension doesn't auto-activate.

Example URL:
https://www.bing.com/search?q=Edge

## Firefox Source Code Readme
This extension includes two 3rd Party libraries in minified form called "Balloon.css" and "Material Components for the Web"

#### Balloon.css (3rd Party Library)
The min.css file can be downloaded from the GitHub repository to ensure it matches what is included in the extension's lib folder:
balloon.min.css

Link:
https://raw.githubusercontent.com/kazzkiq/balloon.css/1deb8231567d3127ce08c963fd898721e85d3c6d/balloon.min.css

#### Material Components for the Web (3rd Party Library)
The extension includes the library "Material Components for the Web" (version 6.0.0), which is designed and developed by Google.
Material Components for the Web Link:
https://github.com/material-components/material-components-web

The library does not host its minified source code on the web; instead it is installed via NPM, which is included with Node.js:
Node.js Download Link:
https://nodejs.org/en/download/
Node Version (Windows Binary 64-Bit ZIP): node-v12.18.3-win-x64
Operating System: Windows 10

After getting NPM, the following command can be run to download the component at the version used by the extension:
npm install material-components-web@6.0.0

The two minified files in this extension's lib folder:
1. material-components-web.min.css
2. material-components-web.min.js

Can then be verified to match what is downloaded via the above npm command (in the following node_modules folder):
\node_modules\material-components-web\dist

## Firefox Screenshot Note
Note: The Firefox version of Infy does use some Background memory because Firefox doesn't yet support non-persistent background extensions.