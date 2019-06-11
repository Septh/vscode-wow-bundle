'use strict';

const jetpack = require('fs-jetpack')

// Some paths
const toolsDir    = jetpack.cwd(__dirname)
const grammarsDir = toolsDir.cwd('..', 'languages', 'grammars')
const dataDir     = toolsDir.cwd('generated')

/*****************************************************************************
 * Turn an array of strings into a RegEx that matches all these strings.
 * This works by splitting the strings into pieces, reducing common prefixes to
 * an alternative of their suffixes, ie. [ 'ApiOne', 'ApiTwo' ] becomes Api(?:One|Two)
 *
 * Notes:
 * - This function is smart enough to avoid unnecessary grouping, so that
 *   [ 'MyApiOne', 'MyApiTwo' ] becomes MyApi(?:One|Two) rather than My(?:Api(?:One|Two))
 *
 * - This function is dumb enough to miss some grouping opportunities, ie.
 *   [ 'ApiOneFunc', 'ApiTwoFunc' ] will *not* become Api(?:One|Two)Func but Api(?:OneFunc|TwoFunc)
 *
 * - Although API functions names in WoW are PascalCase, there are some exceptions.
 *   For those, we'll separate the custom prefix first, then treat the rest of the name as normal PascalCase.
 *
 * - This function will likely not work with arbitrary strings; it is tailored to work
 *   with PascalCase function names and UPPER_SNAKE_CASE event names specifically,
 *   which are both repeating patterns that allow for easy splitting/grouping.
 *****************************************************************************/
const splitter = /^(BN|EJ_|GM|KB|LFG|POI|[A-Z][a-z0-9_]+|[A-Z]+_)(.*)$/
function makeRegexes(names, mayAvoidGrouping = true) {

    const ret = [],
          map = new Map()

    for (const name of names) {
        const parts = splitter.exec(name)
        if (parts) {
            let prefix = parts[1],
                suffix = map.get(prefix) || []
            suffix.push(parts[2])
            map.set(prefix, suffix)
        }
        else {
            map.set(name, [])
        }
    }

    for (let [prefix, rest] of map) {
        if (rest.length == 0) {
            ret.push(prefix)
        }
        else if (rest.length == 1) {
            ret.push(`${prefix}${rest[0]}`)
        }
        else {
            const filtered = rest.filter(word => word.length > 0)
            const subRegexes = makeRegexes(filtered, map.size == 1)

            if (filtered.length < rest.length) {
                // This is an optional suffix
                ret.push(`${prefix}(?:${subRegexes})?`)
            }
            else if (map.size == 1 && mayAvoidGrouping) {
                ret.push(`${prefix}${subRegexes}`)
            }
            else {
                ret.push(`${prefix}(?:${subRegexes})`)
            }
        }
    }

    return ret.join('|')
}

/*****************************************************************************
 * Read a file, extract and filter out words, then make the RegExes.
 * Since regexes can be very big, we also group them by their first letter.
 *****************************************************************************/
const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
      startsWithUpperCaseLetter = /^[A-Z]/,
      trueFn = () => true,
      noMatch = [ '', '' ]
function makeRegexesFromFile(fileName, extractorRx, filterFn = trueFn) {

    const names = dataDir.read(fileName)                        // Read the file
        .split(/\r?\n/)                                         // Split it by lines
        .map(name => (extractorRx.exec(name) || noMatch)[1])    // Extract the names
        .filter(name => name.length && filterFn(name))          // Filter out unwanted names
        .sort()                                                 // Then sort them (this is required for the splice() call below to work)

    // We rely on the fact that all names start with an upper case letter.
    // If somehow some names don't match this condition, and they are sorted before 'regular' names,
    // we'll break. So we need to find the index of the first name that starts with an A
    // and handle filtering/splicing from there.
    const firstOffset = names.findIndex(name => startsWithUpperCaseLetter.test(name))

    const ret = []
    for (const letter of alphabet) {
        const group = names.filter(name => name.startsWith(letter))
        names.splice(firstOffset, group.length)

        ret.push(makeRegexes(group))
    }

    // If there are names left, treat them in a single block
    if (names.length > 0) {
        ret.push(makeRegexes(names))
    }

    return ret
}

// APIs
const luaApis = require(toolsDir.path('output', 'luaFunctions.js')),
      apiExtractor = /^\s*["']?([a-zA-Z0-9_]+)/
function makeApisRegexes(fromFile) {
    // Keep only the functions defined in C - that is, not defined in Lua code
    return makeRegexesFromFile(fromFile, apiExtractor, api => !luaApis[api])
}

// Events
const eventExtractor = /^\s*["']?([A-Z0-9_]+)/
function makeEventsRegexes(fromFile) {
    return makeRegexesFromFile(fromFile, eventExtractor)
}

/*****************************************************************************
 * This is where it all starts...
 *****************************************************************************/

// Prepare our grammar template
const grammar = toolsDir.read('lua-wow.tmLanguage.json', 'json')
grammar.patterns   = grammar.patterns   || []
grammar.repository = grammar.repository || {}

// apis
grammar.patterns.push({ include: "#apis" })
grammar.repository.apis = {
    name: "apis",
    patterns: []
}
for (const regex of makeApisRegexes('API.lua')) {
    if (regex.length > 0) {
        grammar.repository.apis.patterns.push({
            name: "support.function.api.lua",
            match: `\\b(${regex})\\b`
        })
    }
}
for (const regex of makeApisRegexes('APIRemoved.lua')) {
    if (regex.length > 0) {
        grammar.repository.apis.patterns.push({
            name: "invalid.removed.lua",
            match: `\\b(${regex})\\b`
        })
    }
}

// events
grammar.patterns.push({ include: "#events" })
grammar.repository.events = {
    name: "events",
    patterns: []
}
for (const regex of makeEventsRegexes('Events.lua')) {
    if (regex.length > 0) {
        grammar.repository.events.patterns.push({
            name: "event.wow",
            match: `(["'])(${regex})\\1`
        })
    }
}
for (const regex of makeEventsRegexes('EventsRemoved.lua')) {
    if (regex.length > 0) {
        grammar.repository.events.patterns.push({
            name: "invalid.removed.lua",
            match: `(["'])(${regex})\\1`
        })
    }
}

// Write the final tmLanguage file to the extension directory
grammarsDir.write('lua-wow.tmLanguage.json', grammar, { jsonIndent: 4 })
console.log('Done.')
