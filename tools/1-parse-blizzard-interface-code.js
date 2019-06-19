'use strict';

const path      = require('path')
const jetpack   = require('fs-jetpack')
const cheerio   = require('cheerio')
const luaParser = require('luaparse')
const line      = require('single-line-log').stdout
const clui      = require('clui')

// The path to your WoW installation
const wowDir = jetpack.cwd('E:\\World of Warcraft')

// Some paths
const uiCodeDir   = wowDir.cwd('_retail_', 'BlizzardInterfaceCode', 'Interface')
const frameXmlDir = uiCodeDir.cwd('FrameXML')
const addonsDir   = uiCodeDir.cwd('AddOns')
const toolsDir    = jetpack.cwd(__dirname)

// All the global Lua functions we found in Lua scripts
const globalFunctions = [
    // Pre-filled with functions we know are declared in a non-standard way, eg. by assignment instead of the function statement
    'AchievementFrameTab_OnClick',
    'ACHIEVEMENTUI_SELECTEDFILTER',
    'ActorPool_Hide',
    'AudioOptionsVoicePanelChatModeDropdown_OnLoad',
    'AudioOptionsVoicePanelMicDeviceDropDown_OnLoad',
    'AudioOptionsVoicePanelOutputDeviceDropDown_OnLoad',
    'Blizzard_CombatLog_CreateActionMenu',
    'Blizzard_CombatLog_CreateFilterMenu',
    'Blizzard_CombatLog_CreateSpellMenu',
    'Blizzard_CombatLog_CreateTabMenu',
    'Blizzard_CombatLog_CreateUnitMenu',
    'Blizzard_CombatLog_FormattingMenu',
    'Blizzard_CombatLog_MessageTypesMenu',
    'CollectionsMicroButton_OnClick',
    'CollectionsMicroButton_OnEnter',
    'CollectionsMicroButton_OnEvent',
    'CollectionsMicroButton_OnLoad',
    'CombatLog_Color_ColorArrayByEventType',
    'CombatLog_Color_ColorArrayBySchool',
    'CombatLog_Color_ColorArrayByUnitType',
    'CombatLog_Color_ColorStringByEventType',
    'CombatLog_Color_ColorStringBySchool',
    'CombatLog_Color_ColorStringByUnitType',
    'CombatLog_Color_FloatToText',
    'CombatLog_Color_HighlightColorArray',
    'CombatLog_String_DamageResultString',
    'CombatLog_String_GetIcon',
    'CombatLog_String_PowerType',
    'CombatLog_String_SchoolString',
    'CommunitiesMemberListEntry_VoiceActivityNotificationCreatedCallback',
    'CompactRaidFrameContainer_AddGroups',
    'CompactRaidFrameManager_SetSetting',
    'FontStringPool_Hide',
    'FontStringPool_HideAndClearAnchors',
    'FrameStackTooltip_OnEnter',
    'LFD_CURRENT_FILTER',
    'LFR_CURRENT_FILTER',
    'LootJournalClassDropDown_OnLoad',
    'LootJournalItemButton_OnUpdate',
    'QueueStatusFrame_CreateEntriesPool',
    'QueueStatusFrame_SortAndAnchorEntries',
    'SCENARIOS_CURRENT_FILTER',
    'SharedPetAbilityTooltip_ParseExpression',
    'SharedPetAbilityTooltip_ParseText',
    'TexturePool_Hide',
    'TexturePool_HideAndClearAnchors',
    'VideoOptionsDropDownMenu_AddButton',
    'VideoOptionsDropDownMenu_CreateInfo',
    'VideoOptionsDropDownMenu_DisableDropDown',
    'VideoOptionsDropDownMenu_EnableDropDown',
    'VideoOptionsDropDownMenu_GetSelectedID',
    'VideoOptionsDropDownMenu_GetSelectedValue',
    'VideoOptionsDropDownMenu_Initialize',
    'VideoOptionsDropDownMenu_SetSelectedID',
    'VideoOptionsDropDownMenu_SetSelectedValue',
    'VideoOptionsDropDownMenu_SetText',
    'VideoOptionsDropDownMenu_SetWidth',
    'WardrobeSetsCollectionVariantSetsDropDown_OnLoad',
    'WardrobeSetsTransmogModelRightClickDropDown_OnLoad',
]

// All the frame templates we found in XML files
const frameTemplates = []

/**
 * Function to parse a Lua script
 * @param { string } luaFileName - Absolue path to the Lua script to parse
 */
function parseLuaScript(luaFileName) {

    const code = jetpack.read(luaFileName, 'utf8')
    const ast = luaParser.parse(code, {
        // comments: false,
        // scope: true,
        // locations: true
    })

    // For simplicity, we consider only top-level, non-local function declarations
    ast.body.forEach(node => {
        if (node.type === 'FunctionDeclaration' && !node.isLocal && node.identifier && node.identifier.name) {
            globalFunctions.push(node.identifier.name)
        }
    })
}

/**
 * Function to parse an XML file
 * @param { string } xmlFileName - Absolue path to the XML file to parse
 */
function parseXmlFile(xmlFileName) {

    const xmlDir = jetpack.cwd(path.dirname(xmlFileName))
    const xmlData = xmlDir.read(path.basename(xmlFileName), 'utf8')
    const $ = cheerio.load(xmlData, { xmlMode: true })

    // Parse <Include /> tags
    $('Include[file]').toArray().forEach(tag => parseXmlFile(xmlDir.path(tag.attribs.file)))

    // Parse <Script /> tags
    $('Script[file]').toArray().forEach(tag => parseLuaScript(xmlDir.path(tag.attribs.file)))

    // Get the top-level virtual frames
    const sel = [ 'Frame', 'Button', 'CheckButton', 'ScrollFrame', 'Font' ]
        .map(type => `Ui>${type}[virtual=true]`)
        .join(',')

    $(sel).toArray().forEach(tag => frameTemplates.push(tag.attribs.name))
}

/**
 * Function to parse a .toc file
 * @param { string } tocFileName - Absolue path to the toc file to parse
 */
function parseTocFile(tocFileName) {

    const tocDir = jetpack.cwd(path.dirname(tocFileName))

    // Read the toc
    return tocDir.read(path.basename(tocFileName), 'utf8')
        .split(/\r\n?|\n/)
        .filter(line => !line.startsWith('#') && line.trim().length > 0)
        .map(line => tocDir.path(line))
}

/*****************************************************************************
 * This is where it all starts...
 *****************************************************************************/
// 1. Get the list of scripts in FrameXML and the default addons
console.info(`Searching for .toc files in ${wowDir.path()}...`)

let files = parseTocFile(frameXmlDir.path('FrameXML.toc'))
addonsDir.find({ matching: '**/*.toc' }).forEach(addon => {
    files = files.concat(parseTocFile(addonsDir.path(addon)))
})
const numFiles = files.length

// 2. Parse the files
console.info(`Reading ${numFiles} .lua and .xml files...`)

const progress = new clui.Progress(50)
let current = 0
for (const file of files) {
    line(progress.update(++current, numFiles))
    if (file.endsWith('.xml')) {
        parseXmlFile(file)
    }
    else if (file.endsWith('.lua')) {
        parseLuaScript(file)
    }
}
line(`Found ${globalFunctions.length} global functions and ${frameTemplates.length} frame templates, writing to disk...\n`)

// 3. Exports them as JS scripts
const toHash = identifiers => [
    '"use strict;"',
    'module.exports = {',
    `${ identifiers.map(idnt => `${idnt}: 1`).join(',\r\n') }`,
    '}'
].join('\r\n')

globalFunctions.sort()
toolsDir.write(path.join('generated', 'luaFunctions.js'), toHash(globalFunctions))

frameTemplates.sort()
toolsDir.write(path.join('generated', 'frameTemplates.js'), toHash(frameTemplates))

console.info('Done.')
