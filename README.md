# wow-bundle for VS Code
This World of Warcraft addon developper toolset for VS Code includes an improved Lua language colorizer with WoW API knowledge, a .toc file colorizer, and more.


## Features
* Improved Lua grammar
* WoW Lua language extensions, API and libraries support
* `.toc` file colorization
* A new, dedicated color theme based on VS Code's Dark+

![Lua](images/lua.png)


### Grammars

#### Lua
wow-bundle replaces VS Code's built-in Lua language grammar to add a bunch of WoW-related stuff with comprehensive scopes:

* **support.function.wow.language** - Blizzard's extensions to the Lua language
* **support.function.wow.api** - World of Warcraft API functions, with 2 sub-scopes:
	* **support.function.wow.api.nocombat** - API functions that can't be called while in combat
	* **support.function.wow.api.protected** - API functions that can be called only from secure code
* **support.function.wow.library** - Library functions written in Lua (mostly used by UI code)
* **support.class.wow.method** - Widgets methods
* **support.class.wow.script** - Widgets event handlers
* **support.variable.wow.global** - Global objects like `UIParent`, `GameFontNormal` and such
* **support.constant.wow.global** - Global constants like `HIGHLIGHT_FONT_COLOR`, `UIDROPDOWNMENU_INIT_MENU` and such
* **support.constant.wow.event** - Game events like `PLAYER_ENTERING_WORLD`, `VARIABLES_LOADED` and such
* **support.XXXXX.wow.removed** - Removed and/or deprecated stuff in the API, suchs as `ApplyTransmogrifications()` or `UnitIsTapped()`

#### Toc
Also included is a grammar for `.toc` files with the following scopes:

* **keyword.language** - keywords like `##Interface`, `##Author` and such
* **support.language** - X-keywords like `##X-Date`, `##W-Website` and such

![Toc](images/toc.png)



### Colorization
Standard VS Code themes should work well with these scopes as long as they know how to deal with `support.function`, `support.class`, `support.variable` and `support.constant` scopes. These scopes are generally common to all languages.

However, for further colorization granularity, wow-bundle also includes a specific theme based on VS Code's Dark+ default theme and called **Dark+ (WoW)**. To enable this theme, open the Color Theme picker with **File** > **Preferences** > **Color Theme** (or **Code** > **Preferences** > **Color Theme** on Mac).

![theme](images/theme.gif)


**Dark+ (WoW)** only colorizes your `.lua` and `.toc` files and will not interfere with any other language you may use - standard Dark+ colors will still apply to them.


## Known Issues
These are the currently known issues with wow-bundle. Should you whish to collaborate to the projet and help resolve these issues, you're welcome to submit a PR on Github.

* **The WoW API isn't fully complete yet**, some 7.0.3 functions, methods and probably other things are still missing - I'll add them when time permits.
* **Because Blizzard's FrameXML code exposes hundreds of functions**, objects and variables, it is impossible to support them all. Therefore, only a selection of the most frequently used identifiers is supported. Please open an issue on Github if you need to add more.
* **Game events and widgets script handlers are still colorized as strings**. I'm looking for a way to make them stand appart from regular strings.


## TODO

* Fix above issues
* Add code snippets
* Support XML declarations too (low on my priority list, though)
* Support VS Code light themes?
* Add support for popular libraries like Ace3?


## Release notes

### 1.0.0

Initial release.
