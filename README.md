# wow-bundle for VS Code

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/release/Septh/vscode-wow-bundle.svg?style=flat-square)](https://github.com/Septh/vscode-wow-bundle/releases)

This World of Warcraft addon developer toolset for VS Code includes an improved Lua language grammar with WoW API knowledge, a .toc file grammar, colorization for both .lua source and .toc files, and more.


## Features
* Improved Lua grammar
* Blizzard's Lua language extensions, API and libraries
* `.toc` file colorization
* Three new, dedicated color themes based on VS Code's Dark+, Monokai and Monokai Dimmed


### Grammars

#### Lua language
wow-bundle improves VS Code's built-in Lua language grammar. Worth noticing are:
* **OO-style strings and tables calls** support, ie. both `table.concat(mytable)` and `mytable:concat()` are supported
* **Full metamethods** support: `__index`, `__add` & al.
* **Quoted string constants** support: `'string'`, `'table'` & al. as returned by the `type()` function
* Better **character escapes** inside strings: Unicode entities, decimal and hexadecimal values and control chars
* **Deprecated features** like `foreach`/`foreachi` and `getn`/`setn` warning

#### World of Warcraft API
wow-bundle's Lua grammar also tags a bunch of WoW-related stuff with these comprehensive scopes:

* **support.function.wow.language.lua** - Blizzard's extensions to the Lua language like `wipe()`, `strjoin()`, etc.
* **support.function.wow.api.lua** - World of Warcraft API functions, with 2 sub-scopes:
	* **support.function.wow.api.nocombat.lua** - API functions that can't be called while in combat
	* **support.function.wow.api.protected.lua** - API functions that can be called only from secure code
* **support.function.wow.library.lua** - Library functions written in Lua (mostly used by UI code)
* **support.variable.wow.lua** - Global objects like `UIParent`, `GameFontNormal` and such
* **support.variable.wow.value.lua** - Global variables like `HIGHLIGHT_FONT_COLOR_CODE`, `UIDROPDOWNMENU_INIT_MENU` and such
* **support.class.wow.method.lua** - Widgets methods like `:AddLine()`, `:SetTexture()` and such
* **support.constant.wow.string-parameter.lua** - Common function parameters like `'CheckButton'`, `'BOTTOMLEFT'`, `'OVERLAY'`, `'player'` and such
* **support.constant.wow.script-handler.lua** - Widgets event handlers like `'OnEnter'`, `'OnShow'` and such
* **support.constant.wow.event-name.lua** - Game events like `'PLAYER_ENTERING_WORLD'`, `'VARIABLES_LOADED'` and such
* **support.XXX.wow.removed.lua** - Removed and/or deprecated stuff in the API, were **XXX** can be one of **function**, **class**, **variable** or **constant**

These scopes make it easy to colorize everyting WoW-related. See **Colorization** below for details.

![lua](images/lua.png)


#### Toc files
Also included is a simple grammar for `.toc` files with the following scopes:

* **keyword.other.toc** - keywords like `## Interface`, `## Author` and such
* **support.other.toc** - X-keywords like `## X-Date`, `## X-Website` and such

![toc](images/toc.png)


### Colorization
All VS Code themes should word fine with these scopes as long as they follow [the standard scope naming convention](https://manual.macromates.com/en/language_grammars).

However, for further colorization granularity, wow-bundle also includes several specific theme based on VS Code's default themes and called **Dark+ (WoW)**, **Monokai (WoW)** and **Monokai Dimmed (Wow)**. To choose one of these themes, open the Color Theme picker with **File** > **Preferences** > **Color Theme** (or **Code** > **Preferences** > **Color Theme** on Mac).

![themes](images/themes.gif)

wow-bundle's themes only colorizes the scopes described above and does not interfere with VS Code default colors for Lua or any other language you may use.

>New since 1.0.1: I do however add italics to comments ~~and underline to invalid/deprecated keywords~~. I just like it this way. :)

>News since 1.0.7: No more underline for invalids, not everybody likes it.


## Known Issues
These are the currently known issues with wow-bundle. Should you whish to collaborate to the projet and help resolve these issues, you're welcome to submit a PR on Github.

* The WoW API isn't fully complete yet, some 7.0.3 functions, methods and probably other things are still missing - I'll add them when time permits.
* Because Blizzard's FrameXML code exposes hundreds of global functions, objects and variables, it is impossible to support them all. Therefore, only a selection of the most frequently used identifiers is supported. Please open an issue on Github if you need to add more.
* ~~Game events and widgets script handlers are still shown as regular strings. I'm looking for a way to make them stand appart.~~ - Fixed in 1.0.4

Found an issue not listed here? Head up to Github and [open an issue](https://github.com/Septh/vscode-wow-bundle/issues)!


## TODOs (and mayhaps)
1. Fix above issues
2. Add code snippets
3. Support XML declarations too (low on my priority list, though)
4. ~~Support VS Code light themes?~~ Support all standard VS Code themes
5. Linting anyone?
6. Or maybe code formating?
7. IntelliSense support would be great too (I have no idea where to start, though)
8. Add support for popular libraries like LibStub, Ace3, LibDataBroker...?


## Release notes

### 1.0.7
* [language.lua] Added `'k'`, `'v'`, `'kv'` and `'vk'` (used by the `__mode` metamethod) as language constants
* [language.lua] Also added the comma (`,`) and the ellipsis (`...`) as operators
* [language.lua] Better `meta.function.lua` patterns
* [themes] Tweaked some colors and styles

### 1.0.6
* [themes] Added the **Monokai (WoW)** and **Monokai Dimmed (WoW)** themes
* [language.lua] Added the semicolon `;` as an operator (which it is, albeit an optional one)
* [language.lua] Better character escapes matching and colorizing
* [language.lua] Added some identifiers to `support.constant.wow.global.lua`

### 1.0.5
* [language.lua] Added support for Lua types (eg. `'string'`, `'table'`, `'function'`...) as returned by the the `type()` function
* [language.lua] Don't highlight partial words like 'date' in 'update' or 'time' in 'downtime'
* [language.lua] Added API constants for `texture:SetBlendMode()`: `'ADD'`, `'ALPHAKEY'`, `'BLEND'`, `'DISABLE'` and `'MOD'`
* [language.toc] Allow all chars in X-tags, not only numbers, letters and hyphen
* [misc] Removed old `./sources` directory which was completely out of sync

### 1.0.4
* [language.lua] Finally found a way to differenciate quoted constants like functions parameters, event names, script handlers... from strings
* [language.lua] `message()`, `print()`, `getprinthandler()`, `setprinthandler()`, `tostringall()` are actually Lua code in FrameXML, not language extensions
* [language.lua] Added some 7.0.3 identifiers, many are still missing though
* [theme] Changed colors of .toc file keywords for consistency with the default Dark+ colors
* [misc] When the source code reads _'For testing only, comment out before publishing'_, well... just do it

### 1.0.3
* [language.toc] Renamed `keyword.language.toc` and `support.language.toc` scopes to `keyword.other.toc` and `support.other.toc`
* [language.lua] Added a bunch of API definitions
* [language.lua] `tinsert()` and `tremove()` were actually Blizzard language extensions that got ~~removed~~ deprecated in WoW 6.0.2

### 1.0.2
* [language.lua] Stupid typo fix
* Updated `Readme.md`

### 1.0.1
* [theme] Stop recolorizing the default Lua language constructs, you'll really get Dark+ colors for these
* Reorganized the internal directory structure in preparation for TODO #4

### 1.0.0
Initial release.
