- [How to customize colors in Lua and Toc files](#how-to-customize-colors-in-lua-and-toc-files)
    - [Reasons for removal](#reasons-for-removal)
    - [How it works](#how-it-works)
    - [Going deeper](#going-deeper)
    - [Customizing .lua and .toc files colors in WoW Bundle](#customizing-lua-and-toc-files-colors-in-wow-bundle)
    - [Tips & tricks](#tips--tricks)
    - [Useful readings](#useful-readings)


# How to customize colors in Lua and Toc files

Starting with 1.4.0, WoW Bundle no longer includes the four specific themes the previous versions had - namely `Dark+ (WoW)`, `Light+ (WoW)`, `Monokaï (WoW)` and `Monokaï Dimmed (WoW)`. If you used one of these themes, VS Code will revert to its builtin default Dark or Light theme after you upgrade WoW Bundle to 1.4.0.

## Reasons for removal

When I first released WoW Bundle back in october 2016, there was no way for the user or an extension author to set custom colors for language keywords and variables in VS Code, so overwriting the default themes with augmented versions was the only way to go.

The technique worked but had some serious drawbacks:
1. **It was hard to maintain**: I had to check with every release if the VS Code team changed the default themes and eventually incorporate the new versions in the extension.
2.  **It was a burden for the user**: they were stucked with my themes if they wanted the WoW API correctly colorized in VS Code. Using other, 3rd party themes was of course still possible, but then the WoW API would not stand out.

Then Microsoft introduced the `editor.tokenColorCustomizations` setting in [VS Code 1.15](https://code.visualstudio.com/updates/v1_15#_user-definable-syntax-highlighting-colors) and extended this setting with theme specific configurations in [VS Code 1.20](https://code.visualstudio.com/updates/v1_20#_theme-specific-color-customizations).

To be honest, I didn't notice immediately. When I did, my first thought was to have the extension programmatically set the colors itself but after some testing I quickly discovered that unfortunately, the VS Code API doesn't allow an extension to update the editor settings - only the user can.

So the choice became simple: either I kept going with integrating my own version of the VS Code themes in WoW Bundle, or I removed them altogether and let the user know how to customize the colors by themselves.

For WoW Bundle 1.3.0, I chose the first option.

For 1.4.0, I chose the second option and I firmly believe this was the best thing to do. This leaves more flexibility to you, the user, as you can choose whatever theme you like and still adjust the colors you want exactly to fit your needs and taste.


## How it works

As mentionned above, it all works by editing the VS Code `settings.json` file. For this, you may:
* Use the `Preferences: Open Settings (JSON)` command in the command palette, or
* Click the cogwheel icon in the lower left corner of the VS Code window then, in the `Text Editor` category, scroll down to `Token Color Customizations` and click on `Edit in settings.json`.

You will then need to add an `editor.tokenColorCustomizations` setting if it's not already there:

    "editor.tokenColorCustomizations": {
    }

>Note: don't forget the double-quotes around `editor.tokenColorCustomizations`, they are mandatory.

This is where you will add the rules to fine-tune the colors.

A rule is simply a collection of key/value pairs. Here, the *key* may be one of `comments`, `strings`, `numbers`, `keywords`, `types`, `functions`, `variables` or `textMateRules`. The first seven keys are obvious as to what they represent; we'll get to the `textMateRules` key a little later.

The *value* is another collection of key/value pairs. The key can be anyone of `foreground`, `background` or `fontStyle` while the value will be the color (in CSS format) or the font style (`"bold"`, `"italic"`, `"underline"` or any combination) you want applied.

So, if I wrote:

    "editor.tokenColorCustomizations": {
        "comments": {
            "fontStyle": "italic"
        }
    }

>Note: again, the double-quotes around each word are mandatory.

Then VS Code would display the comments in any language and with any theme in italics.

You can of course mix and match several rules at once:

    "editor.tokenColorCustomizations": {
        "comments": {
            "fontStyle": "italic"
        },
        "numbers": {
            "foreground": "#b5cea8",
            "fontStyle": "bold"
        }
    }

This means: *display comments in italics and numbers in yellow-green color and bold style, no matter what language I am coding with and what color theme I am using.*


## Going deeper

This seems all good at first sight, but these rules have two major flaws:

1. They are *global*, ie., they apply indistinctly to all languages (Lua, Javascript, C#...) and with all color themes.
2. They are *general*, ie., they can not distinguish between line comments and block comments, for instance.

Enters the `textMateRules` key we saw earlier. Its syntax is a little different and it allows you to target more precisely per-language elements:

    "editor.tokenColorCustomizations": {
        "comments": {
            "fontStyle": "italic"
        },
        "textMateRules": [
            {
                "scope": "comment.block.js",
                "settings": {
                    "foreground": "#6a9955",
                }
            },
            {
                "scope": "comment.block.lua",
                "settings": {
                    "foreground": "#569cd6"
                }
            }
        ]
    }

This would still display all comments in italics (first rule), but Javascript block comments would be green (textMateRule #1) while Lua block comments would be blue (textMateRule #2).

As you can see in the above example, the value for `textMateRules` is an array, hence the use of the square brackets `[` and `]` instead of curly brackets, and we introduced two new keys: `scope` and `settings`. `scope` targets some language element and `settings`, well, hmm... sets the properties for this element.

As a matter of fact, a single `scope` key can target several language elements. In the previous example, we styled only block comments; if we wanted to give both single- and multi-line comments the same style, here's what we'd write:

    {
        "scope": [ "comment.block.lua", "comment.line.double-dash.lua" ],
        "settings": {
            "foreground": "#569cd6"
        }
    }

Rather than a single scope name, the `scope` value can also be an array of several scope names. The associated `settings` entry will then apply to all the scopes listed.

Now, the question is: how do you know what scope name targets what language element?

VS Code has a tool just for that: in the command palette, run the `Developers: Inspect TM Scopes` command. Now, a little window will tell you the scope(s) under the cursor. Press the `Esc` key to close the scope inspector.

## Customizing .lua and .toc files colors in WoW Bundle

Bellow is the list of all scopes defined by WoW Bundle's Lua and Toc grammars. You may use these scope names to personnalize the colors of Lua source files and Toc files in VS Code.


## Tips & tricks


## Useful readings

https://macromates.com/manual/en/language_grammars
