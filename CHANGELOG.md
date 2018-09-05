## 1.2.6
- [language.lua] Updated to (hopefully) match WoW 8.0 build 27547.

## 1.2.5
- [language.lua] Updated to (hopefully) match WoW 7.3.2 build 25549.
- [language.lua] Added support for intendation rules to lua-language-configuration.json

## 1.2.4
- [language.lua] Updated to match WoW 7.2.5 build 24330.

## 1.2.3
- [language.lua] Updated to match WoW 7.2.5 build 24076.

## 1.2.2
- [language.lua] More identifiers. Again.
- [themes] Incorporated the latest (1.12.2) VS Code default themes

## 1.2.1
- [language.lua] More closely match WoW's Lua 5.1 environement: functions like `tinsert()`, `table.getn()`, `table.foreach()`... actually exist in WoW so we don't tag them as invalid or deprecated anymore.
- [language.lua] Fixed a typo in `'RightButton'`
- [language.lua] Added a few more identifiers
- [general] Reworked and simplified [Readme.md](Readme.md)

## 1.2.0
- [language.lua] Added some more identifiers to match up WoW 7.2.0
- [snippets] New: 80+ code snippets, courtesy of m4xc4v413r4
- [themes] Incorporated the latest (1.11) VS Code default themes
- [general] Cleaned up directories

## 1.1.11
- [language.lua] Added some more identifiers to match up WoW 7.1.5

## 1.1.10
- [general] Fixed the color mismatch in WoW themes introduced by VS Code 1.9.0

## 1.1.9
- [language.lua] Added some more identifiers -- again

## 1.1.8
- [language.lua] Added some more identifiers

## 1.1.7
- [language.lua] Added some more identifiers

## 1.1.6
- [language.lua] More regexes optimizations
- [language.lua] Added some more identifiers

## 1.1.5
- Inadvertently broke a regex. Oops.

## 1.1.4
- [language.lua] Optimized some more regexes
- [language.lua] Added some more identifiers
- [themes] Incorporated latest (v1.7) Dark and Dark+ themes
- [misc] moved CHANGELOG.md to a separate file

## 1.1.3
- [language.lua] Corrected a typo that prevented the bundle from correctly loading. Sorry guys.

## 1.1.2
- [language.lua] Allow method calls on array items, eg. thins like `mytable[1]:SetText('something')` will be correctly recognized
- [language.lua] Added some missing widget methods

## 1.1.1
- [language.lua] More regexes optimizations
- [language.lua] More Library and removed functions
- [themes] Added Light+ (WoW) color theme

## 1.1.0
- [general] Major code cleanup, rewrote almost all regexes
- [languages.lua] No longer differenciate Blizzard's Lua extensions like `strsplit()` or `wipe()` from core Lua functions, they all show up as **support.function.lua**. This was done because a) wow-bundle is a WoW-colorizer, not a Lua one; and b) this reduces the kaleidoscope-ish look of Lua code
- [language.lua] Lua tables do not have a __metatable, things like `mytable:sort()` do not exist
- [language.lua] Renamed a bunch of scopes to more closely adhere to scope naming conventions

## 1.0.8
- Not really. Just got things mixed up and bumped an already bumped version tag...

## 1.0.7
- [language.lua] Added `'k'`, `'v'`, `'kv'` and `'vk'` (used by the `__mode` metamethod) as quoted constants
- [language.lua] Also added the comma (`,`) and the ellipsis (`...`) as operators
- [language.lua] Better `meta.function.lua` patterns
- [themes] Tweaked some colors and styles

## 1.0.6
- [themes] Added the **Monokai (WoW)** and **Monokai Dimmed (WoW)** themes
- [language.lua] Added the semicolon `;` as an operator (which it is, albeit an optional one)
- [language.lua] Better character escapes matching and colorizing
- [language.lua] Added some identifiers to `support.constant.wow.global.lua`

## 1.0.5
- [language.lua] Added support for Lua types (eg. `'string'`, `'table'`, `'function'`...) as returned by the the `type()` function
- [language.lua] Don't highlight partial words like 'date' in 'update' or 'time' in 'downtime'
- [language.lua] Added API constants for `texture:SetBlendMode()`: `'ADD'`, `'ALPHAKEY'`, `'BLEND'`, `'DISABLE'` and `'MOD'`
- [language.toc] Allow all chars in X-tags, not only numbers, letters and hyphen
- [misc] Removed old `./sources` directory which was completely out of sync

## 1.0.4
- [language.lua] Finally found a way to differenciate quoted constants like functions parameters, event names, script handlers... from strings
- [language.lua] `message()`, `print()`, `getprinthandler()`, `setprinthandler()`, `tostringall()` are actually Lua code in FrameXML, not language extensions
- [language.lua] Added some 7.0.3 identifiers, many are still missing though
- [theme] Changed colors of .toc file keywords for consistency with the default Dark+ colors
- [misc] When the source code reads _'For testing only, comment out before publishing'_, well... just do it

## 1.0.3
- [language.toc] Renamed `keyword.language.toc` and `support.language.toc` scopes to `keyword.other.toc` and `support.other.toc`
- [language.lua] Added a bunch of API definitions
- [language.lua] `tinsert()` and `tremove()` were actually Blizzard language extensions that got ~~removed~~ deprecated in WoW 6.0.2

## 1.0.2
- [language.lua] Stupid typo fix
- Updated `Readme.md`

## 1.0.1
- [theme] Stop recolorizing the default Lua language constructs, you'll really get Dark+ colors for these
- Reorganized the internal directory structure in preparation for TODO #4

## 1.0.0
Initial release.
