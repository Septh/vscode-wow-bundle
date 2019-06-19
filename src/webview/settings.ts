/*
 * Typages adaptés pour une gestion plus facile
 * On ne travaille qu'avec ces types, le service 'settings.service' se chargeant de faire les conversions
 */

/*
 * Gestion des réglages
 */

// Version éditable des réglages : un simple map { theme: réglages }
export interface IEditableSettings {
    [ bracketedThemeName: string ]: IEditableRule[]
}

// Version éditable d'une règle TextMate
export interface IEditableRule {
    name?: string   // Inutilisé ici, mais gardé dans les réglages
    scope: string   // Pas de tableau ici, 1 règle = 1 scope
    settings: {
        foreground?: string
        background?: string
        fontStyle?: string
    },
    // Flags pour l'interface, initialisés la première fois que la règle est affichée/éditée
    flags?: {
        setForeground: boolean
        setBackground: boolean
        setFontStyle: boolean
    }
}

/*
 * Gestion des thèmes
 */

// Version éditable de la liste des thèmes
export interface IEditableTheme {
    id: string          // Toujours présent
    label: string       // Toujours présent
    type: string
}

const THEME_BRACKETS_REGEX = /^\[([^\]]*)\]$/u   // $1 => nom sans les crochets
const noMatch = [ '', '' ]
export const EThemeNames = {
    NONE:    '[]',
    GLOBAL:  '[global]',
    DEFAULT: '[Default Dark+]',

    bracketed:   (name: string) => `[${name}]`,
    unbracketed: (name: string) => (THEME_BRACKETS_REGEX.exec(name) || noMatch)[1],
    isBracketed: (name: string) => THEME_BRACKETS_REGEX.test(name)
}

/*
 * Catégories des réglages pour l'IU
 */

// Décrit les scopes éditables
interface IRuleDescription {
    name: string
    description?: string
    scope: string
}

interface ISectionDescription {
    title: string
    rules: IRuleDescription[]
}

export interface ICategoryDescription {
    title: string
    sections: ISectionDescription[]
}

// Les personnalisations, classées par catégories
// TODO: Localize this
export const settingsCategories: ICategoryDescription[] = [
    {
        title: 'Lua language',
        sections: [
            {
                title: 'Comments',
                rules: [
                    {
                        name: 'Block',
                        description: 'Comments starting with <code>--[[</code> and ending with <code>]]</code>',
                        scope: 'comment.block.wow.lua'
                    },
                    {
                        name: 'Single line',
                        description: 'Comments starting with <code>--</code>',
                        scope: 'comment.line.double-dash.wow.lua'
                    }
                ]
            },
            {
                title: 'Language',
                rules: [
                    {
                        name: 'Control and flow keywords',
                        description: 'Keywords like <code>function</code>, <code>do</code>, etc.',
                        scope: 'keyword.control.wow.lua'
                    },
                    {
                        name: 'Storage modifier',
                        description: 'The <code>local</code> keyword, specifically',
                        scope: 'storage.modifier.wow.lua'
                    },
                    {
                        name: 'Logical operators',
                        description: 'Namely <code>and</code>, <code>or</code> and <code>not</code>',
                        scope: 'keyword.operator.logical.wow.lua'
                    },
                    {
                        name: 'Operators',
                        description: 'All other mathematical, binary and unary operators',
                        scope: 'keyword.operator.wow.lua'
                    },
                    {
                        name: 'Standard functions',
                        description: 'Things like <code>pairs()</code>, <code>table.insert()</code>, etc.',
                        scope: 'support.function.wow.lua'
                    },
                    {
                        name: 'Table metamethods names',
                        // description: '"__add", "__index", etc. in metatables',
                        scope: 'support.function.metamethod.wow.lua'
                    },
                    {
                        name: 'String constants',
                        description: 'Special strings consumed or returned by language functions, e.g. the <code>"table"</code> string returned by the <code>type()</code> function',
                        scope: 'constant.language.quoted.wow.lua'
                    },
                    {
                        name: 'Reserved: language variables',
                        description: 'The special <code>self</code>, <code>_</code>, <code>_G</code> and <code>_VERSION</code> identifiers',
                        scope: 'variable.language.wow.lua'
                    },
                    {
                        name: 'Reserved: language constants',
                        description: 'The special <code>true</code>, <code>false</code> and <code>nil</code> identifiers',
                        scope: 'constant.language.wow.lua'
                    },
                    {
                        name: 'Reserved: math constants',
                        description: 'The special <code>huge</code> and <code>pi</code> identifiers from the math library',
                        scope: 'support.constant.wow.lua'
                    },
                ]
            },
            {
                title: 'Strings',
                rules: [
                    {
                        name: 'Single-quoted strings',
                        scope: 'string.quoted.single.wow.lua'
                    },
                    {
                        name: 'Double quoted strings',
                        scope: 'string.quoted.double.wow.lua'
                    },
                    {
                        name: 'Multiline strings',
                        description: 'Those between <code>[[</code> double-brackets <code>]]</code>',
                        scope: 'string.quoted.other.wow.lua'
                    },
                    {
                        name: 'Character escapes',
                        description: 'Escape sequences within strings',
                        scope: 'constant.character.escape.wow.lua'
                    },
                ]
            },
            {
                title: 'Numbers',
                rules: [
                    {
                        name: 'Literal numbers',
                        description: 'Decimal, hexadecimal, octal and floating literals',
                        scope: 'constant.numeric.wow.lua'
                    },
                ]
            },
            {
                title: 'User defined',
                rules: [
                    {
                        name: 'Function declaration: function name',
                        description: 'The name of the function',
                        scope: 'entity.name.function.wow.lua'
                    },
                    {
                        name: 'Function declaration: parameters',
                        description: 'The names of the parameters',
                        scope: 'variable.parameter.wow.lua'
                    },
                    {
                        name: 'Table declaration: table name',
                        description: 'The name of the table',
                        scope: 'entity.name.table.wow.lua'
                    },
                    {
                        name: 'Table declaration: members',
                        description: 'Property names within a table declarations',
                        scope: 'entity.name.member.wow.lua'
                    },
                    {
                        name: 'Table declaration: methods',
                        description: 'Function names within a table declarations',
                        scope: 'entity.name.method.wow.lua'
                    }
                ]
            },
            {
                title: 'Invalid',
                rules: [
                    {
                        name: 'Illegal',
                        description: 'Things illegal in WoW\'s version of Lua',
                        scope: 'invalid.illegal.wow.lua'
                    },
                    {
                        name: 'Removed',
                        description: 'Things once present in WoW but removed by Blizzard over time',
                        scope: 'invalid.removed.wow.lua'
                    },
                ]
            }
        ]
    },
    {
        title: 'WoW API',
        sections: [
            {
                title: 'C API',
                rules: [
                    {
                        name: 'Functions',
                        description: 'Top-level functions and namespaces',
                        scope: 'support.function.api.wow.lua'
                    },
                    {
                        name: 'Functions: protected',
                        description: 'Functions that can be called only from secure code',
                        scope: 'support.function.api.wow.lua.protected'
                    },
                    {
                        name: 'Functions: no-combat',
                        description: 'Functions that can\'t be called while in combat',
                        scope: 'support.function.api.wow.lua.nocombat'
                    },
                    {
                        name: 'Widget methods',
                        description: '<code>:Show()</code>, <code>:AddDoubleLine()</code>, etc.',
                        scope: 'support.method.api.wow.lua'
                    },
                    {
                        name: 'API strings: general',
                        description: '<code>"TOPLEFT"</code>, <code>"ANCHOR_RIGHT"</code>, <code>"MiddleButton"</code>, <code>"Horde"</code>, etc.',
                        scope: 'support.constant.quoted.api.wow.lua'
                    },
                    {
                        name: 'API strings: widget events',
                        description: '<code>"OnShow"</code>, <code>"OnClick"</code>, etc.',
                        scope: 'support.constant.quoted.handler.api.wow.lua'
                    },
                    {
                        name: 'API strings: game events',
                        description: '<code>"PLAYER_ENTERING_WORLD"</code>, etc.',
                        scope: 'support.constant.quoted.event.api.wow.lua'
                    },
                ]
            },
            {
                title: 'FrameXML',
                rules: [
                    {
                        name: 'Functions',
                        // description: 'Things like "ToggleSpellBook()", "UIFrameFade()", etc.',
                        scope: 'support.function.library.wow.lua'
                    },
                    {
                        name: 'Objects',
                        description: '<code>UIParent</code>, <code>GameFontNormal</code>, etc.',
                        scope: 'support.variable.object.library.wow.lua'
                    },
                    {
                        name: 'Constants',
                        description: '<code>SOUNDKIT.IG_QUEST_LOG_OPEN</code>, <code>SILVER_PER_GOLD</code>, etc.',
                        scope: 'support.variable.value.library.wow.lua'
                    },
                ]
            }
        ]
    },
    {
        title: 'TOC Files',
        sections: [
            {
                title: 'Keywords',
                rules: [
                    {
                        name: 'Keywords',
                        // description: 'Standard keywords',
                        scope: 'keyword.control.wow.toc'
                    },
                    {
                        name: 'X-Keywords',
                        // description: 'eXtended keywords',
                        scope: 'keyword.control.x.wow.toc'
                    },
                    {
                        name: 'Operators',
                        description: 'The dashes and the colon between the keyword and its value',
                        scope: 'keyword.operator.wow.toc'
                    },
                    {
                        name: 'Parameter',
                        // description: 'The value for the keyword',
                        scope: 'variable.other.wow.toc'
                    },
                ]
            },
            {
                title: 'Comments',
                rules: [
                    {
                        name: 'Comments',
                        // description: 'Comments starting with a single dash-sign (#)',
                        scope: 'comment.wow.toc'
                    },
                ]
            },
        ]
    }
]
