# wow-bundle for VS Code

[![The MIT License](https://img.shields.io/badge/license-MIT-orange.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/github/release/Septh/vscode-wow-bundle.svg?style=flat-square)](https://github.com/Septh/vscode-wow-bundle/releases)

This World of Warcraft addon developer toolset for VS Code includes an improved Lua language grammar with WoW API knowledge, a .toc file grammar, colorization for both .lua source and .toc files, and more.

**Notice:** wow-bundle is NOT a generic Lua colorizer, it is closely bound to WoW specificities and may not be adapted to other Lua environments.

## Warning

 * With WoW 7.3, Blizzard removed the 3 files I used to maintain wow-bundle (namely `GlobalAPI.lua`, `WidgetAPI.lua` and `Events.lua` from the `Helix` directory). Therefore, I cannot guarantee any longer that the bundle is 100% accurate with respect to the lastest WoW API.


## Features

* **Full (I hope...) WoW 7.3.x API**
* **New since 1.2.0: A bunch of useful code snippets, thanks to [m4xc4v413r4](https://github.com/m4xc4v413r4)**
* Improved Lua 5.1 grammar with World of Warcraft's built-in Lua interpreter specificities
* Extensive FrameXML widgets and Lua library support
* `.toc` file colorization
* Four new, dedicated color themes based on VS Code's default themes: Light+, Dark+, Monokai and Monokai Dimmed


### Grammars

#### > Lua 5.1 language

wow-bundle replaces VS Code's built-in Lua language grammar. Changes worth noticing are:

* **OO-style string functions** support, ie. both `string.upper(mystring)` and `mystring:upper()` are supported
* **Full metamethods** support
* **Quoted string constants** as used or returned by the `collectgarbage()`, `date()` and `type()` functions and the `__mode()` metamethod
* Better **character escapes** inside strings: Unicode entities, decimal and hexadecimal values and control chars


#### > World of Warcraft API

wow-bundle's Lua grammar also tags a bunch of WoW-related stuff:

* **Blizzard's extensions to the Lua language** like `[table.]wipe()`, `strjoin()`, etc.
* **World of Warcraft API functions**, with support for functions that can't be called while in combat and functions that can be called only from secure code
* **WoW Library functions** written in Lua (mostly used by UI code)
* **Global objects** like `UIParent`, `GameFontNormal` and such
* **Global variables** like `HIGHLIGHT_FONT_COLOR_CODE`, `UIDROPDOWNMENU_INIT_MENU` and such
* **Widgets methods** like `:AddLine()`, `:SetTexture()` and such
* **Common function parameters** like `'CheckButton'`, `'BOTTOMLEFT'`, `'OVERLAY'`, `'player'` and such
* **Widgets event handler names** like `'OnEnter'`, `'OnShow'` and such
* **Game events** like `'PLAYER_ENTERING_WORLD'`, `'VARIABLES_LOADED'` and such
* Removed and/or deprecated stuff in the API

![lua](images/lua.png)


#### > Toc files

Also included is a simple grammar for `.toc` files with support for keywords (like `## Interface`, `## Author` and such) and X-keywords (like `## X-Date`, `## X-Website` and such)

![toc](images/toc.png)


### Colorization

All VS Code themes should word fine with wow-bundle as long as they follow [the standard scope naming convention](https://manual.macromates.com/en/language_grammars).

However, for further colorization granularity, wow-bundle also includes four specific theme based on VS Code's default themes and called **Light+ (WoW)**, **Dark+ (WoW)**, **Monokai (WoW)** and **Monokai Dimmed (WoW)**. To choose one of these themes, open the Color Theme picker with **File** > **Preferences** > **Color Theme** (or **Code** > **Preferences** > **Color Theme** on Mac).

![themes](images/themes.gif)

wow-bundle's themes do not interfere with VS Code default colors for Lua or any other language you may use.

>New since 1.0.1: I do however add italics to ALL comments ~~and underline to invalid/deprecated keywords~~.

>New since 1.0.7: No more underline for invalids, not everybody likes it.


## Known Issues

These are the currently known issues with wow-bundle. Should you whish to collaborate to the projet and help resolve these issues, you're welcome to submit a PR on Github.

* ~~The WoW API isn't fully complete yet, some 7.0.3 functions, methods and probably other things are still missing - I'll add them when time permits.~~ - Full 7.1 support since v1.1.0
* Because Blizzard's FrameXML code exposes hundreds of global functions, objects and variables, it is impossible to support them all. Therefore, only a selection of the most frequently used identifiers is supported. Please open an issue on Github if you need to add more.
* ~~Game events and widgets script handlers are still shown as regular strings. I'm looking for a way to make them stand appart.~~ - Fixed in 1.0.4

Found an issue not listed here? Head up to Github and [open an issue](https://github.com/Septh/vscode-wow-bundle/issues)!


## TODOs (and mayhaps)

1. ~~Fix above issues~~
2. ~~Add code snippets~~
3. Support XML declarations too (low on my priority list, though)
4. ~~Support VS Code light themes?~~ ~~Support all standard VS Code themes~~ I'm done with themes - If you need more, just ask, I'll consider it
5. Linting anyone?
6. Or maybe code formating?
7. IntelliSense support would be great too (I have no idea where to start, though)
8. Add support for popular libraries like LibStub, Ace3, LibDataBroker...?


## Release notes

See [Changelog.md](CHANGELOG.md)

[wow-bundle]: https://github.com/Septh/vscode-wow-bundle
[VS Code]: https://code.visualstudio.com/
