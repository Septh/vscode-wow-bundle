--
-- /!\ Ne pas lancer ce script dans WoW mais avec l'interpréteur Lua
--
-- Code source de Blizzard extrait du jeu via la console (commande 'ExportInterfaceFiles code')

-- Modules LuaRocks importés (utiliser 'luarocks doc <rock>' pour les infos sur le module)
local bitop   = require('bitop.funcs')
local serpent = require('serpent')
local inspect = require('inspect')
local lfs     = require('lfs')
local pathlib = require('prtr-path')
pathlib.install()

-- Constantes
local INTERFACE_PATH   = pathlib.empty  / [[BlizzardInterfaceCode\Interface]]
local FRAMEXML_PATH    = INTERFACE_PATH / [[FrameXML]]
local FRAMEXML_VERSION = '8.0.1'
local FRAMEXML_BUILD   = '28153'
local ADDONS_PATH      = INTERFACE_PATH / [[AddOns]]
local DB_FILE          = pathlib.empty  / [[..\db.lua]]   -- A côté de #G_API.toc

-- Sauve le répertoire courant
local cwd = lfs.currentdir()

-- Les Listes des scripts trouvés
local scripts = {}

-------------------------------------------------------------------------------
-- Fonctions utilitaires diverses
-------------------------------------------------------------------------------

-- Crée une chaîne aléatorie
local rs_charset = {}  do -- [0-9a-zA-Z]
    for c = 48, 57  do table.insert(rs_charset, string.char(c)) end
    for c = 65, 90  do table.insert(rs_charset, string.char(c)) end
    for c = 97, 122 do table.insert(rs_charset, string.char(c)) end
end
local function randomString(length)
    if not length or length <= 0 then return '' end
    math.randomseed(os.clock()^5)
    return randomString(length - 1) .. rs_charset[math.random(1, #rs_charset)]
end

-- Supprime les espaces en début et en fin de chaîne
-- (cf. http://lua-users.org/wiki/StringTrim - trim2())
local function strtrim(s)
    return s:match "^%s*(.-)%s*$"
end

-- Convertit une pattern en son équivalent insensible à la casse
-- (adapté de https://stackoverflow.com/a/11402486/3558398)
local function nocase(pattern)
    return pattern:gsub("(%%?)(%a)", function(percent, letter)
        return percent == '%' and percent .. letter or ("[%s%s]"):format(letter:lower(), letter:upper())
    end)
end

-- Charge la liste des scripts référencés par un fichier .toc
-- Prend en charge les scripts référencés via un fichier xml
local tocPatterns = {
    tocTags = {
        [ nocase "^##%s*Title%s*:%s*(.-)$"] = 'title',
        [ nocase "^##%s*Dependencies%s*:%s*(.-)$"] = 'deps',
        [ nocase "^##%s*RequiredDeps?%s*:%s*(.-)$"] = 'deps',
        [ nocase "^##%s*OptionalDeps%s?*:%s*(.-)$"] = 'optDeps',
    },
    dotXML = nocase [[.xml$]],
    dotLUA = nocase [[.lua$]],
    xmlScriptTag = nocase [[<%s-Script%s+file%s-=%s-"%s-(%S%S-.lua)%s-"%s-/>]],
}

local function readToc(tocPath)
    assert(pathlib.type(tocPath) == 'path')

    -- Prépare le tableau à retourner
    local tocData = {
        name  = select(2, string.match(tostring(tocPath.file), [[(.-)([^\/]-)(%.[^%.\/]*)$]])), -- Nom sans chemin ni extension
        files = {},
        tbl   = {}
    }

    -- Ouvre le fchier
    local toc, err = io.open(tocPath, "r")
    if err then error(err) end

    -- Lit les lignes une à une
    for line in toc:lines() do
        if line:sub(1, 2) == '##' then
            for pattern, tag in pairs(tocPatterns.tocTags) do
                local value = line:match(pattern)
                if value then
                    tocData[tag] = strtrim(value)
                end
            end
        elseif line:len() > 1 then
            if line:match(tocPatterns.dotXML) then
                -- Si c'est un fichier XML, lit les scripts qu'il référence
                local xml, err = io.open(tocPath.dir / line)
                if err then
                    -- Affiche l'erreur mais n'interrompt pas le programme
                    -- (il y a au moins 1 fichier introuvable dans le build 28153)
                    print(err)
                else
                    for tag in xml:lines() do
                        local script = tag:match(tocPatterns.xmlScriptTag)
                        if script then
                            -- L'emplacement du script est relatif au fichier xml
                            table.insert(tocData.files, tostring(pathlib.split(line).dir / script))
                        end
                    end
                    xml:close()
                end
            elseif line:match(tocPatterns.dotLUA) then
                table.insert(tocData.files, line)
            end
        end
    end
    toc:close()
    return tocData
end

-------------------------------------------------------------------------------
-- 1) FrameXML
-------------------------------------------------------------------------------
scripts.framexml = readToc(FRAMEXML_PATH / 'FrameXML.toc')

-------------------------------------------------------------------------------
-- 2) AddOns Blizzard_**
-------------------------------------------------------------------------------
scripts.addons = {}
do
    for addon in lfs.dir(ADDONS_PATH) do
        local addonPath = ADDONS_PATH / addon
        if lfs.attributes(addonPath, 'mode') == 'directory' and lfs.touch(addonPath / (addon .. '.toc')) then
            table.insert(scripts.addons, readToc(addonPath / (addon .. '.toc')))
        end
    end

    -- Trie la liste des addons par ordre alphabétique
    table.sort(scripts.addons, function(a1, a2) return a1.name < a2.name end)
end

-------------------------------------------------------------------------------
-- 3) Exécute tous les scripts recensés
-------------------------------------------------------------------------------

-- Un "environnement" pour exécuter les scripts Lua de WoW
local env = {}
setmetatable(env, { __index = _G })

do
    -- Simule toutes les variables/fonctions globales de WoW nécessaires
    do
        local call = function(f, ...) return f(...) end
        local nop  = function() end
        local yep  = function() return true end
        local frame = {
            GetParent = nop,
            RegisterEvent = nop, SetScript = nop, GetScript = function() return nop end,
            Show = nop, Hide = nop, SetSize = nop, SetPoint = nop,
            SetFontObject = nop,
            Text = { SetText = nop },
            AddQueuedAlertFrameSubSystem = nop,
            AddMessage = print,
            RegisterWidgetVisTypeTemplate = nop
        }
        bit = bitop.bit32
        issecure = nop
        seterrorhandler = yep
        format = string.format
        strlower = string.lower
        strjoin = function(sep, ...) return table.concat({...}, sep) end
        string.join = strjoin
        table.wipe = function(t) local count = #t; for i=0, count do t[i]=nil end; for k in next, t do rawset(t, k, nil) end; end
        wipe = table.wipe
        tinsert = table.insert
        tremove = table.remove
        ceil = math.ceil
        PI = math.pi
        pcall = call
        securecall = call
        assert = yep
        forceinsecure = yep
        tostringall = function(...) local t={}; for i=1,#... do t[i] = tostring(select(i, ...)) end return unpack(t) end
        geterrorhandler = function() return nop end
        SecureCapsuleGet = function(n) return _G[n] end

        C_AdventureMap = { Close = nop }
        C_ArtifactUI = {}
        C_AzeriteEmpoweredItem = { CloseAzeriteEmpoweredItemRespec = nop }
        C_CharacterServicesPublic = { ShouldSeeControlPopup = nop }
        C_Club = {}
        C_ContributionCollector = { Close = nop }
        C_PaperDollInfo = { OffhandHasShield = nop }
        C_PetBattles = { GetAllEffectNames = nop, GetAllStates = nop }
        C_Scenario = { ShouldShowCriteria = yep }
        C_ScrappingMachineUI = { CloseScrappingMachine = nop }
        C_Timer = { After = nop }
        C_TradeSkillUI = {CloseObliterumForge = nop }
        C_VoiceChat = { GetPushToTalkBinding = nop, SetPushToTalkBinding = nop }
        C_Widget = { IsFrameWidget = nop }

        GetNumQuestLogEntries = function() return 0 end
        GetCVarBool = nop
        AchievementAlertSystem = { SetCanShowMoreConditionFunc = nop }
        AlertFrame = frame
        CreateFrame = function() return frame end
        FillLocalizedClassList = nop
        GetChatTypeIndex = function() return 1 end
        GetExpansionLevel = function() return 7 end
        GetInventorySlotInfo = function() return 1 end
        GetItemQualityColor = function() return 1,1,1,1 end
        GetScenariosChoiceOrder = nop
        IsGMClient = nop
        IsOnGlueScreen = nop
        RegisterStaticConstants = nop
        UnitFactionGroup = function() return 'Alliance' end
        UnitRace = function() return 'HUMAN', 'Human' end
        UnitSex = function() return 1 end
        VideoOptionsFrame = frame
        VideoOptionsFrameCategoryFrame = frame
        GetItemClassInfo = function(a) return "GetItemClassInfo" .. tostring(a) end
        GetItemSubClassInfo = function(a, b) return "GetItemSubClassInfo" .. tostring(a) .. tostring(b) end
        GetItemInventorySlotInfo = function(a) return "GetItemInventorySlotInfo" .. tostring(a) end
        GetAuctionItemSubClasses = function() return randomString(20), randomString(20), randomString(20) end
        GuildFrameTab1 = frame
        ChatFrame1, ChatFrame2, ChatFrame3, ChatFrame4 = frame, frame, frame, frame
        DEFAULT_CHAT_FRAME = frame
        BrowseNameText = frame
        BrowseName = frame
        BrowseLevelHyphen = frame
        BrowseMinLevel = frame
        BrowseMaxLevel = frame
        BrowseDropDown = frame
        WowTokenGameTimeTutorial = { LeftDisplay = { Label = frame }, RightDisplay = { Label = frame }}
        ObjectiveTrackerFrame = { BlocksFrame = { QuestHeader = frame, AchievementHeader = frame, ScenarioHeader = frame }}
        UIWidgetManager = frame

        LE_EXPANSION_CLASSIC = 0
        LE_EXPANSION_BURNING_CRUSADE = 1
        LE_EXPANSION_WRATH_OF_THE_LICH_KING = 2
        LE_EXPANSION_CATACLYSM = 3
        LE_EXPANSION_MISTS_OF_PANDARIA = 4
        LE_EXPANSION_WARLORDS_OF_DRAENOR = 5
        LE_EXPANSION_LEGION = 6
        LE_EXPANSION_BATTLE_FOR_AZEROTH = 7
        LE_EXPANSION_9_0 = 8
        LE_EXPANSION_10_0 = 9
        LE_EXPANSION_11_0 = 10

        NUM_LE_ITEM_QUALITYS = 9
        LE_ITEM_QUALITY_POOR = 0
        LE_ITEM_QUALITY_COMMON = 1
        LE_ITEM_QUALITY_UNCOMMON = 2
        LE_ITEM_QUALITY_RARE = 3
        LE_ITEM_QUALITY_EPIC = 4
        LE_ITEM_QUALITY_LEGENDARY = 5
        LE_ITEM_QUALITY_ARTIFACT = 6
        LE_ITEM_QUALITY_HEIRLOOM = 7
        LE_ITEM_QUALITY_WOW_TOKEN = 8

        NUM_LE_WORLD_QUEST_QUALITYS = 3
        LE_WORLD_QUEST_QUALITY_COMMON = 1
        LE_WORLD_QUEST_QUALITY_RARE = 2
        LE_WORLD_QUEST_QUALITY_EPIC = 3

        NUM_LE_LFG_CATEGORYS = 7
        LE_LFG_CATEGORY_LFD = 1
        LE_LFG_CATEGORY_LFR = 2
        LE_LFG_CATEGORY_RF = 3
        LE_LFG_CATEGORY_SCENARIO = 4
        LE_LFG_CATEGORY_FLEXRAID = 5
        LE_LFG_CATEGORY_WORLDPVP = 6
        LE_LFG_CATEGORY_BATTLEFIELD = 7

        NUM_LE_GARR_FOLLOWER_QUALITYS = 7
        LE_GARR_FOLLOWER_QUALITY_NONE = 0
        LE_GARR_FOLLOWER_QUALITY_COMMON = 1
        LE_GARR_FOLLOWER_QUALITY_UNCOMMON = 2
        LE_GARR_FOLLOWER_QUALITY_RARE = 3
        LE_GARR_FOLLOWER_QUALITY_EPIC = 4
        LE_GARR_FOLLOWER_QUALITY_LEGENDARY = 5
        LE_GARR_FOLLOWER_QUALITY_TITLE = 6

        NUM_LE_FOLLOWER_TYPES = 5
        LE_FOLLOWER_TYPE_GARRISON_6_0 = 1
        LE_FOLLOWER_TYPE_SHIPYARD_6_2 = 2
        LE_FOLLOWER_TYPE_GARRISON_7_0 = 4
        LE_FOLLOWER_TYPE_GARRISON_8_0 = 22

        NUM_LE_FOLLOWER_ABILITY_CAST_RESULTS = 14
        LE_FOLLOWER_ABILITY_CAST_RESULT_SUCCESS = 1
        LE_FOLLOWER_ABILITY_CAST_RESULT_FAILURE = 2
        LE_FOLLOWER_ABILITY_CAST_RESULT_NO_PENDING_CAST = 3
        LE_FOLLOWER_ABILITY_CAST_RESULT_INVALID_TARGET = 4
        LE_FOLLOWER_ABILITY_CAST_RESULT_INVALID_FOLLOWER_SPELL = 5
        LE_FOLLOWER_ABILITY_CAST_RESULT_REROLL_NOT_ALLOWED = 6
        LE_FOLLOWER_ABILITY_CAST_RESULT_SINGLE_MISSION_DURATION = 7
        LE_FOLLOWER_ABILITY_CAST_RESULT_MUST_TARGET_FOLLOWER = 8
        LE_FOLLOWER_ABILITY_CAST_RESULT_MUST_TARGET_TRAIT = 9
        LE_FOLLOWER_ABILITY_CAST_RESULT_INVALID_FOLLOWER_TYPE = 10
        LE_FOLLOWER_ABILITY_CAST_RESULT_MUST_BE_UNIQUE = 11
        LE_FOLLOWER_ABILITY_CAST_RESULT_CANNOT_TARGET_LIMITED_USE_FOLLOWER = 12
        LE_FOLLOWER_ABILITY_CAST_RESULT_MUST_TARGET_LIMITED_USE_FOLLOWER = 13
        LE_FOLLOWER_ABILITY_CAST_RESULT_ALREADY_AT_MAX_DURABILITY = 14

        LE_QUEST_TAG_TYPE_TAG = 0
        LE_QUEST_TAG_TYPE_PROFESSION = 1
        LE_QUEST_TAG_TYPE_NORMAL = 2
        LE_QUEST_TAG_TYPE_PVP = 3
        LE_QUEST_TAG_TYPE_PET_BATTLE = 4
        LE_QUEST_TAG_TYPE_BOUNTY = 5
        LE_QUEST_TAG_TYPE_DUNGEON = 6
        LE_QUEST_TAG_TYPE_INVASION = 7
        LE_QUEST_TAG_TYPE_RAID = 8
        LE_QUEST_TAG_TYPE_INVASION_WRAPPER = 11

        NUM_LE_BAG_FILTER_FLAGS = 5
        LE_BAG_FILTER_FLAG_IGNORE_CLEANUP = 1
        LE_BAG_FILTER_FLAG_EQUIPMENT = 2
        LE_BAG_FILTER_FLAG_CONSUMABLES = 3
        LE_BAG_FILTER_FLAG_TRADE_GOODS = 4
        LE_BAG_FILTER_FLAG_JUNK = 5

        NUM_LE_INVENTORY_TYPES = 29
        LE_INVENTORY_TYPE_NON_EQUIP_TYPE = 0
        LE_INVENTORY_TYPE_HEAD_TYPE = 1
        LE_INVENTORY_TYPE_NECK_TYPE = 2
        LE_INVENTORY_TYPE_SHOULDER_TYPE = 3
        LE_INVENTORY_TYPE_BODY_TYPE = 4
        LE_INVENTORY_TYPE_CHEST_TYPE = 5
        LE_INVENTORY_TYPE_WAIST_TYPE = 6
        LE_INVENTORY_TYPE_LEGS_TYPE = 7
        LE_INVENTORY_TYPE_FEET_TYPE = 8
        LE_INVENTORY_TYPE_WRIST_TYPE = 9
        LE_INVENTORY_TYPE_HAND_TYPE = 10
        LE_INVENTORY_TYPE_FINGER_TYPE = 11
        LE_INVENTORY_TYPE_TRINKET_TYPE = 12
        LE_INVENTORY_TYPE_WEAPON_TYPE = 13
        LE_INVENTORY_TYPE_SHIELD_TYPE = 14
        LE_INVENTORY_TYPE_RANGED_TYPE = 15
        LE_INVENTORY_TYPE_CLOAK_TYPE = 16
        LE_INVENTORY_TYPE_2HWEAPON_TYPE = 17
        LE_INVENTORY_TYPE_BAG_TYPE = 18
        LE_INVENTORY_TYPE_TABARD_TYPE = 19
        LE_INVENTORY_TYPE_ROBE_TYPE = 20
        LE_INVENTORY_TYPE_WEAPONMAINHAND_TYPE = 21
        LE_INVENTORY_TYPE_WEAPONOFFHAND_TYPE = 22
        LE_INVENTORY_TYPE_HOLDABLE_TYPE = 23
        LE_INVENTORY_TYPE_AMMO_TYPE = 24
        LE_INVENTORY_TYPE_THROWN_TYPE = 25
        LE_INVENTORY_TYPE_RANGEDRIGHT_TYPE = 26
        LE_INVENTORY_TYPE_QUIVER_TYPE = 27
        LE_INVENTORY_TYPE_RELIC_TYPE = 28

        LE_TRANSMOG_COLLECTION_TYPE_HEAD = 1
        LE_TRANSMOG_COLLECTION_TYPE_SHOULDER = 2
        LE_TRANSMOG_COLLECTION_TYPE_BACK = 3
        LE_TRANSMOG_COLLECTION_TYPE_CHEST = 4
        LE_TRANSMOG_COLLECTION_TYPE_SHIRT = 5
        LE_TRANSMOG_COLLECTION_TYPE_TABARD = 6
        LE_TRANSMOG_COLLECTION_TYPE_WRIST = 7
        LE_TRANSMOG_COLLECTION_TYPE_HANDS = 8
        LE_TRANSMOG_COLLECTION_TYPE_WAIST = 9
        LE_TRANSMOG_COLLECTION_TYPE_LEGS = 10
        LE_TRANSMOG_COLLECTION_TYPE_FEET = 11
        LE_TRANSMOG_COLLECTION_TYPE_WAND = 12
        LE_TRANSMOG_COLLECTION_TYPE_1H_AXE = 13
        LE_TRANSMOG_COLLECTION_TYPE_1H_SWORD = 14
        LE_TRANSMOG_COLLECTION_TYPE_1H_MACE = 15
        LE_TRANSMOG_COLLECTION_TYPE_DAGGER = 16
        LE_TRANSMOG_COLLECTION_TYPE_FIST = 17
        LE_TRANSMOG_COLLECTION_TYPE_SHIELD = 18
        LE_TRANSMOG_COLLECTION_TYPE_HOLDABLE = 19
        LE_TRANSMOG_COLLECTION_TYPE_2H_AXE = 20
        LE_TRANSMOG_COLLECTION_TYPE_2H_SWORD = 21
        LE_TRANSMOG_COLLECTION_TYPE_2H_MACE = 22
        LE_TRANSMOG_COLLECTION_TYPE_STAFF = 23
        LE_TRANSMOG_COLLECTION_TYPE_POLEARM = 24
        LE_TRANSMOG_COLLECTION_TYPE_BOW = 25
        LE_TRANSMOG_COLLECTION_TYPE_GUN = 26
        LE_TRANSMOG_COLLECTION_TYPE_CROSSBOW = 27
        LE_TRANSMOG_COLLECTION_TYPE_WARGLAIVES = 28

        LE_GAME_ERR_SPELL_FAILED_TOTEMS = 245
        LE_GAME_ERR_SPELL_FAILED_EQUIPPED_ITEM = 248
        LE_GAME_ERR_SPELL_ALREADY_KNOWN_S = 56
        LE_GAME_ERR_SPELL_FAILED_SHAPESHIFT_FORM_S = 250
        LE_GAME_ERR_SPELL_FAILED_ALREADY_AT_FULL_MANA = 475
        LE_GAME_ERR_OUT_OF_MANA = 327
        LE_GAME_ERR_SPELL_OUT_OF_RANGE = 358
        LE_GAME_ERR_SPELL_FAILED_S = 50
        LE_GAME_ERR_SPELL_FAILED_REAGENTS = 246
        LE_GAME_ERR_SPELL_FAILED_REAGENTS_GENERIC = 247
        LE_GAME_ERR_SPELL_FAILED_NOTUNSHEATHED = 374
        LE_GAME_ERR_SPELL_UNLEARNED_S = 389
        LE_GAME_ERR_SPELL_FAILED_EQUIPPED_SPECIFIC_ITEM = 319
        LE_GAME_ERR_SPELL_FAILED_ALREADY_AT_FULL_POWER_S = 476
        LE_GAME_ERR_SPELL_FAILED_EQUIPPED_ITEM_CLASS_S = 249
        LE_GAME_ERR_SPELL_FAILED_ALREADY_AT_FULL_HEALTH = 474
        LE_GAME_ERR_GENERIC_NO_VALID_TARGETS = 666
        LE_GAME_ERR_ITEM_COOLDOWN = 51
        LE_GAME_ERR_CANT_USE_ITEM = 186
        LE_GAME_ERR_SPELL_FAILED_ANOTHER_IN_PROGRESS = 251
        LE_GAME_ERR_ABILITY_COOLDOWN = 55
        LE_GAME_ERR_SPELL_COOLDOWN = 54
        LE_GAME_ERR_SPELL_FAILED_ANOTHER_IN_PROGRESS = 251
        LE_GAME_ERR_OUT_OF_HOLY_POWER = 337
        LE_GAME_ERR_OUT_OF_POWER_DISPLAY = 344
        LE_GAME_ERR_OUT_OF_SOUL_SHARDS = 335
        LE_GAME_ERR_OUT_OF_FOCUS = 329
        LE_GAME_ERR_OUT_OF_COMBO_POINTS = 339
        LE_GAME_ERR_OUT_OF_CHI = 331
        LE_GAME_ERR_OUT_OF_PAIN = 343
        LE_GAME_ERR_OUT_OF_HEALTH = 332
        LE_GAME_ERR_OUT_OF_RAGE = 328
        LE_GAME_ERR_OUT_OF_ARCANE_CHARGES = 341
        LE_GAME_ERR_OUT_OF_RANGE = 150
        LE_GAME_ERR_OUT_OF_ENERGY = 330
        LE_GAME_ERR_OUT_OF_LUNAR_POWER = 336
        LE_GAME_ERR_OUT_OF_RUNIC_POWER = 334
        LE_GAME_ERR_OUT_OF_INSANITY = 340
        LE_GAME_ERR_OUT_OF_RUNES = 333
        LE_GAME_ERR_OUT_OF_FURY = 342
        LE_GAME_ERR_OUT_OF_MAELSTROM = 338

        NUM_LE_AUTOCOMPLETE_PRIORITYS = 6
        LE_AUTOCOMPLETE_PRIORITY_OTHER = 1
        LE_AUTOCOMPLETE_PRIORITY_INTERACTED = 2
        LE_AUTOCOMPLETE_PRIORITY_IN_GROUP = 3
        LE_AUTOCOMPLETE_PRIORITY_GUILD = 4
        LE_AUTOCOMPLETE_PRIORITY_FRIEND = 5
        LE_AUTOCOMPLETE_PRIORITY_ACCOUNT_CHARACTER = 6
        LE_AUTOCOMPLETE_PRIORITY_ACCOUNT_CHARACTER_SAME_REALM = 7

        NUM_LE_PARTY_CATEGORYS = 2
        LE_PARTY_CATEGORY_HOME = 1
        LE_PARTY_CATEGORY_INSTANCE = 2

        NUM_LE_GARRISON_TALENT_AVAILABILITYS = 8
        LE_GARRISON_TALENT_AVAILABILITY_AVAILABLE = 1
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE = 2
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_ANOTHER_IS_RESEARCHING = 3
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_NOT_ENOUGH_RESOURCES = 4
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_NOT_ENOUGH_GOLD = 5
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_TIER_UNAVAILABLE = 6
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_PLAYER_CONDITION = 7
        LE_GARRISON_TALENT_AVAILABILITY_UNAVAILABLE_ALREADY_HAVE = 8

        NUM_LE_UNIT_STATS = 4
        LE_UNIT_STAT_STRENGTH = 1
        LE_UNIT_STAT_AGILITY = 2
        LE_UNIT_STAT_STAMINA = 3
        LE_UNIT_STAT_INTELLECT = 4

        Enum = {
            ["ClubErrorType"] = {
                ["ErrorClubNoSuchInvitation"] = 21,
                ["ErrorCommunitiesMissingShortName"] = 11,
                ["ErrorClubSentInvitationCountAtMax"] = 32,
                ["ErrorClubBanCountAtMax"] = 36,
                ["ErrorClubNotMember"] = 18,
                ["ErrorCommunitiesUnknown"] = 1,
                ["ErrorCommunitiesNone"] = 0,
                ["ErrorClubStreamInvalidName"] = 28,
                ["ErrorClubTicketCountAtMax"] = 37,
                ["ErrorClubNoClub"] = 17,
                ["ErrorClubTicketHasConsumedAllowedRedeemCount"] = 39,
                ["ErrorCommunitiesNeutralFaction"] = 2,
                ["ErrorCommunitiesTrial"] = 13,
                ["ErrorClubAlreadyMember"] = 19,
                ["ErrorCommunitiesWrongRegion"] = 9,
                ["ErrorClubNoSuchMember"] = 20,
                ["ErrorCommunitiesProfanity"] = 12,
                ["ErrorClubTicketNoSuchTicket"] = 38,
                ["ErrorCommunitiesUnknownTicket"] = 10,
                ["ErrorClubFull"] = 16,
                ["ErrorClubInvitationAlreadyExists"] = 22,
                ["ErrorClubBanAlreadyExists"] = 35,
                ["ErrorClubVoiceFull"] = 26,
                ["ErrorCommunitiesGuild"] = 8,
                ["ErrorCommunitiesChatMute"] = 15,
                ["ErrorCommunitiesIgnored"] = 7,
                ["ErrorClubReceivedInvitationCountAtMax"] = 33,
                ["ErrorClubMemberHasRequiredRole"] = 31,
                ["ErrorClubStreamNoStream"] = 27,
                ["ErrorCommunitiesVeteranTrial"] = 14,
                ["ErrorClubStreamCountAtMax"] = 30,
                ["ErrorClubTargetIsBanned"] = 34,
                ["ErrorCommunitiesUnknownRealm"] = 3,
                ["ErrorCommunitiesBadTarget"] = 4,
                ["ErrorCommunitiesWrongFaction"] = 5,
                ["ErrorClubStreamCountAtMin"] = 29,
                ["ErrorClubInsufficientPrivileges"] = 24,
                ["ErrorCommunitiesRestricted"] = 6,
                ["ErrorClubTooManyClubsJoined"] = 25,
                ["ErrorClubInvalidRoleID"] = 23,
            },
            ["ItemQualityMeta"] = {
                ["NumValues"] = 9,
                ["MinValue"] = 0,
                ["MaxValue"] = 8,
            },
            ["ManipulatorEventType"] = {
                ["Start"] = 0,
                ["Delete"] = 3,
                ["Move"] = 1,
                ["Complete"] = 2,
            },
            ["ClubInvitationCandidateStatus"] = {
                ["AlreadyMember"] = 2,
                ["Available"] = 0,
                ["InvitePending"] = 1,
            },
            ["BattlepayGroupDisplayTypeMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["PowerTypeMeta"] = {
                ["NumValues"] = 22,
                ["MinValue"] = -2,
                ["MaxValue"] = 19,
            },
            ["VignetteType"] = {
                ["Normal"] = 0,
                ["PvpBounty"] = 1,
            },
            ["ClubInvitationCandidateStatusMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["ClubFieldType"] = {
                ["ClubDescription"] = 2,
                ["NumTypes"] = 6,
                ["ClubStreamName"] = 4,
                ["ClubShortName"] = 1,
                ["ClubStreamSubject"] = 5,
                ["ClubName"] = 0,
                ["ClubBroadcast"] = 3,
            },
            ["CustomBindingTypeMeta"] = {
                ["NumValues"] = 1,
                ["MinValue"] = 0,
                ["MaxValue"] = 0,
            },
            ["CustomBindingType"] = {
                ["VoicePushToTalk"] = 0,
            },
            ["WidgetEnabledState"] = {
                ["Enabled"] = 1,
                ["Disabled"] = 0,
                ["Highlight"] = 3,
                ["Red"] = 2,
            },
            ["BrawlType"] = {
                ["None"] = 0,
                ["Arena"] = 2,
                ["Battleground"] = 1,
                ["Lfg"] = 3,
            },
            ["UIMapType"] = {
                ["Dungeon"] = 4,
                ["Orphan"] = 6,
                ["Zone"] = 3,
                ["Continent"] = 2,
                ["Cosmic"] = 0,
                ["Micro"] = 5,
                ["World"] = 1,
            },
            ["FlightPathState"] = {
                ["Reachable"] = 1,
                ["Current"] = 0,
                ["Unreachable"] = 2,
            },
            ["BattlepayDisplayFlagMeta"] = {
                ["NumValues"] = 5,
                ["MinValue"] = 1,
                ["MaxValue"] = 16,
            },
            ["ClubErrorTypeMeta"] = {
                ["NumValues"] = 40,
                ["MinValue"] = 0,
                ["MaxValue"] = 39,
            },
            ["WidgetShownStateMeta"] = {
                ["NumValues"] = 2,
                ["MinValue"] = 0,
                ["MaxValue"] = 1,
            },
            ["ManipulatorEventTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["ClubRestrictionReason"] = {
                ["None"] = 0,
                ["Unavailable"] = 1,
            },
            ["ZoneAbilityType"] = {
                ["Garrison"] = 0,
                ["Argus"] = 2,
                ["WarEffort"] = 3,
                ["OrderHall"] = 1,
            },
            ["ClubRoleIdentifier"] = {
                ["Moderator"] = 3,
                ["Member"] = 4,
                ["Leader"] = 2,
                ["Owner"] = 1,
            },
            ["ValidateNameResultMeta"] = {
                ["NumValues"] = 17,
                ["MinValue"] = 0,
                ["MaxValue"] = 16,
            },
            ["UIWidgetVisualizationTypeMeta"] = {
                ["NumValues"] = 13,
                ["MinValue"] = 0,
                ["MaxValue"] = 12,
            },
            ["CommunicationModeMeta"] = {
                ["NumValues"] = 2,
                ["MinValue"] = 0,
                ["MaxValue"] = 1,
            },
            ["UIWidgetVisualizationType"] = {
                ["StatusBar"] = 2,
                ["ScenarioHeaderCurrenciesAndBackground"] = 11,
                ["IconTextAndBackground"] = 4,
                ["IconAndText"] = 0,
                ["StackedResourceTracker"] = 6,
                ["DoubleStatusBar"] = 3,
                ["TextWithState"] = 8,
                ["DoubleIconAndText"] = 5,
                ["BulletTextList"] = 10,
                ["TextureWithState"] = 12,
                ["HorizontalCurrencies"] = 9,
                ["CaptureBar"] = 1,
                ["IconTextAndCurrencies"] = 7,
            },
            ["ContributionState"] = {
                ["UnderAttack"] = 3,
                ["Active"] = 2,
                ["Building"] = 1,
                ["Destroyed"] = 4,
                ["None"] = 0,
            },
            ["StoreErrorMeta"] = {
                ["NumValues"] = 12,
                ["MinValue"] = 0,
                ["MaxValue"] = 11,
            },
            ["ModelSceneType"] = {
                ["ArtifactTier2SlamEffect"] = 7,
                ["AzeriteRewardGlow"] = 15,
                ["MountJournal"] = 0,
                ["ArtifactTier2ForgingScene"] = 6,
                ["ArtifactTier2"] = 5,
                ["AzeritePowers"] = 14,
                ["ArtifactRelicTalentEffect"] = 9,
                ["CommentatorVictoryFanfare"] = 8,
                ["PvpWarModeOrb"] = 10,
                ["AzeriteItemLevelUpToast"] = 13,
                ["PartyPose"] = 12,
                ["ShopCard"] = 2,
                ["PvpWarModeFire"] = 11,
                ["EncounterJournal"] = 3,
                ["PetJournalCard"] = 1,
                ["PetJournalLoadout"] = 4,
            },
            ["ClubTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["BattlepayProductDecoratorMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["CalendarEventType"] = {
                ["Other"] = 4,
                ["HeroicDeprecated"] = 5,
                ["Pvp"] = 2,
                ["Raid"] = 0,
                ["Dungeon"] = 1,
                ["Meeting"] = 3,
            },
            ["ClubStreamNotificationFilterMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["PerfCounter"] = {
                ["PerfCountUnits"] = 3,
                ["PerfCountPrimitiveCount"] = 17,
                ["PerfCountBatchCount"] = 22,
            },
            ["TransmogSource"] = {
                ["HiddenUntilCollected"] = 5,
                ["Vendor"] = 3,
                ["CantCollect"] = 6,
                ["Profession"] = 8,
                ["Quest"] = 2,
                ["NotValidForTransmog"] = 9,
                ["Achievement"] = 7,
                ["JournalEncounter"] = 1,
                ["WorldDrop"] = 4,
                ["None"] = 0,
            },
            ["ChatChannelType"] = {
                ["Custom"] = 1,
                ["Private_Party"] = 2,
                ["Public_Party"] = 3,
                ["Communities"] = 4,
                ["None"] = 0,
            },
            ["VoiceChatStatusCodeMeta"] = {
                ["NumValues"] = 23,
                ["MinValue"] = 0,
                ["MaxValue"] = 22,
            },
            ["ContributionResult"] = {
                ["InternalError"] = 7,
                ["MustBeNearNpc"] = 1,
                ["Success"] = 0,
                ["FailedConditionCheck"] = 5,
                ["QuestDataMissing"] = 4,
                ["InvalidID"] = 3,
                ["UnableToCompleteTurnIn"] = 6,
                ["IncorrectState"] = 2,
            },
            ["QuestTag"] = {
                ["Scenario"] = 98,
                ["Raid10"] = 88,
                ["Dungeon"] = 81,
                ["Legendary"] = 83,
                ["Pvp"] = 41,
                ["Group"] = 1,
                ["Raid25"] = 89,
                ["Raid"] = 62,
                ["Heroic"] = 85,
                ["Account"] = 102,
            },
            ["ClubType"] = {
                ["Other"] = 3,
                ["Character"] = 1,
                ["Guild"] = 2,
                ["BattleNet"] = 0,
            },
            ["ConsoleCommandTypeMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["CalendarEventTypeMeta"] = {
                ["NumValues"] = 6,
                ["MinValue"] = 0,
                ["MaxValue"] = 5,
            },
            ["CommunicationMode"] = {
                ["PushToTalk"] = 0,
                ["OpenMic"] = 1,
            },
            ["ContributionStateMeta"] = {
                ["NumValues"] = 5,
                ["MinValue"] = 0,
                ["MaxValue"] = 4,
            },
            ["ClubRestrictionReasonMeta"] = {
                ["NumValues"] = 2,
                ["MinValue"] = 0,
                ["MaxValue"] = 1,
            },
            ["ModelSceneSettingMeta"] = {
                ["NumValues"] = 1,
                ["MinValue"] = 1,
                ["MaxValue"] = 1,
            },
            ["StoreDeliveryTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["VasPurchaseProgressMeta"] = {
                ["NumValues"] = 8,
                ["MinValue"] = 0,
                ["MaxValue"] = 7,
            },
            ["BattlepaySpecialProductsMeta"] = {
                ["NumValues"] = 1,
                ["MinValue"] = 0,
                ["MaxValue"] = 12,
            },
            ["WidgetEnabledStateMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["ClubMemberPresenceMeta"] = {
                ["NumValues"] = 6,
                ["MinValue"] = 0,
                ["MaxValue"] = 5,
            },
            ["IconAndTextWidgetStateMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["FlightPathFaction"] = {
                ["Horde"] = 1,
                ["Alliance"] = 2,
                ["Neutral"] = 0,
            },
            ["FlightPathFactionMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["PerfActivityMeta"] = {
                ["NumValues"] = 6,
                ["MinValue"] = 0,
                ["MaxValue"] = 5,
            },
            ["ClubFieldTypeMeta"] = {
                ["NumValues"] = 7,
                ["MinValue"] = 0,
                ["MaxValue"] = 6,
            },
            ["IconAndTextWidgetState"] = {
                ["Shown"] = 1,
                ["ShownWithDynamicIconNotFlashing"] = 3,
                ["Hidden"] = 0,
                ["ShownWithDynamicIconFlashing"] = 2,
            },
            ["WidgetShownState"] = {
                ["Hidden"] = 0,
                ["Shown"] = 1,
            },
            ["SelfResurrectOptionType"] = {
                ["Item"] = 1,
                ["Spell"] = 0,
            },
            ["ClubRemovedReasonMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["ZoneAbilityTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["CharacterServiceInfoFlagMeta"] = {
                ["NumValues"] = 1,
                ["MinValue"] = 1,
                ["MaxValue"] = 1,
            },
            ["BattlepayProductGroupFlagMeta"] = {
                ["NumValues"] = 5,
                ["MinValue"] = 1,
                ["MaxValue"] = 16,
            },
            ["ConsoleColorType"] = {
                ["HighlightColor"] = 7,
                ["PrivateColor"] = 10,
                ["DefaultColor"] = 0,
                ["WarningColor"] = 4,
                ["GlobalColor"] = 5,
                ["AdminColor"] = 6,
                ["InputColor"] = 1,
                ["EchoColor"] = 2,
                ["ClickbufferColor"] = 9,
                ["DefaultGreen"] = 11,
                ["BackgroundColor"] = 8,
                ["ErrorColor"] = 3,
            },
            ["UIMapTypeMeta"] = {
                ["NumValues"] = 7,
                ["MinValue"] = 0,
                ["MaxValue"] = 6,
            },
            ["ClubStreamTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["VasErrorMeta"] = {
                ["NumValues"] = 29,
                ["MinValue"] = 0,
                ["MaxValue"] = 20085,
            },
            ["InventoryTypeMeta"] = {
                ["NumValues"] = 29,
                ["MinValue"] = 0,
                ["MaxValue"] = 28,
            },
            ["ModelSceneTypeMeta"] = {
                ["NumValues"] = 16,
                ["MinValue"] = 0,
                ["MaxValue"] = 15,
            },
            ["ClubRemovedReason"] = {
                ["Removed"] = 2,
                ["Banned"] = 1,
                ["ClubDestroyed"] = 3,
                ["None"] = 0,
            },
            ["ValidateNameResult"] = {
                ["NameNoName"] = 2,
                ["NameRussianSilentCharacterAtBeginningOrEnd"] = 15,
                ["NameDeclensionDoesntMatchBaseName"] = 16,
                ["NameInvalidApostrophe"] = 9,
                ["NameSuccess"] = 0,
                ["NameProfane"] = 7,
                ["NameConsecutiveSpaces"] = 13,
                ["NameReserved"] = 8,
                ["NameInvalidSpace"] = 12,
                ["NameMultipleApostrophes"] = 10,
                ["NameInvalidCharacter"] = 5,
                ["NameRussianConsecutiveSilentCharacters"] = 14,
                ["NameTooLong"] = 4,
                ["NameFailure"] = 1,
                ["NameTooShort"] = 3,
                ["NameMixedLanguages"] = 6,
                ["NameThreeConsecutive"] = 11,
            },
            ["ClubMemberPresence"] = {
                ["Away"] = 4,
                ["Busy"] = 5,
                ["Online"] = 1,
                ["Unknown"] = 0,
                ["Offline"] = 3,
                ["OnlineMobile"] = 2,
            },
            ["BrawlTypeMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 3,
            },
            ["QuestLineFloorLocation"] = {
                ["Same"] = 2,
                ["Below"] = 1,
                ["Above"] = 0,
            },
            ["PerfActivity"] = {
                ["ActivitySwap"] = 25,
                ["ActivityAnimate"] = 16,
                ["ActivityUnit"] = 40,
                ["ActivityEventnet"] = 35,
                ["ActivityWorldLink"] = 6,
                ["ActivityModelRender"] = 12,
            },
            ["ConsoleColorTypeMeta"] = {
                ["NumValues"] = 12,
                ["MinValue"] = 0,
                ["MaxValue"] = 11,
            },
            ["ConsoleCategoryMeta"] = {
                ["NumValues"] = 10,
                ["MinValue"] = 0,
                ["MaxValue"] = 9,
            },
            ["QuestLineFloorLocationMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["ClubRoleIdentifierMeta"] = {
                ["NumValues"] = 4,
                ["MinValue"] = 0,
                ["MaxValue"] = 4,
            },
            ["MapCanvasPositionMeta"] = {
                ["NumValues"] = 5,
                ["MinValue"] = 0,
                ["MaxValue"] = 4,
            },
            ["InventoryType"] = {
                ["IndexHandType"] = 10,
                ["IndexRelicType"] = 28,
                ["IndexBagType"] = 18,
                ["IndexFingerType"] = 11,
                ["IndexThrownType"] = 25,
                ["IndexTabardType"] = 19,
                ["IndexFeetType"] = 8,
                ["IndexHoldableType"] = 23,
                ["IndexShieldType"] = 14,
                ["IndexBodyType"] = 4,
                ["IndexNeckType"] = 2,
                ["IndexShoulderType"] = 3,
                ["IndexWristType"] = 9,
                ["IndexRangedrightType"] = 26,
                ["IndexHeadType"] = 1,
                ["IndexAmmoType"] = 24,
                ["IndexChestType"] = 5,
                ["IndexWeaponType"] = 13,
                ["Index2HweaponType"] = 17,
                ["IndexCloakType"] = 16,
                ["IndexNonEquipType"] = 0,
                ["IndexLegsType"] = 7,
                ["IndexWaistType"] = 6,
                ["IndexRobeType"] = 20,
                ["IndexQuiverType"] = 27,
                ["IndexWeaponoffhandType"] = 22,
                ["IndexTrinketType"] = 12,
                ["IndexWeaponmainhandType"] = 21,
                ["IndexRangedType"] = 15,
            },
            ["ConsoleCategory"] = {
                ["CategoryDebug"] = 0,
                ["CategoryGm"] = 8,
                ["CategoryNone"] = 9,
                ["CategoryNet"] = 6,
                ["CategoryConsole"] = 2,
                ["CategoryDefault"] = 5,
                ["CategoryGraphics"] = 1,
                ["CategorySound"] = 7,
                ["CategoryCombat"] = 3,
                ["CategoryGame"] = 4,
            },
            ["ClubActionType"] = {
                ["ErrorClubActionAcceptInvitation"] = 13,
                ["ErrorClubActionDestroyStream"] = 17,
                ["ErrorClubActionCreateTicket"] = 5,
                ["ErrorClubActionDeclineInvitation"] = 14,
                ["ErrorClubActionInviteMember"] = 18,
                ["ErrorClubActionGetTickets"] = 9,
                ["ErrorClubActionGetInvitations"] = 11,
                ["ErrorClubActionRedeemTicket"] = 7,
                ["ErrorClubActionAddBan"] = 22,
                ["ErrorClubActionGetTicket"] = 8,
                ["ErrorClubActionCreateMessage"] = 24,
                ["ErrorClubActionDestroyMessage"] = 26,
                ["ErrorClubActionLeave"] = 4,
                ["ErrorClubActionEdit"] = 2,
                ["ErrorClubActionDestroyTicket"] = 6,
                ["ErrorClubActionGetBans"] = 10,
                ["ErrorClubActionRevokeInvitation"] = 12,
                ["ErrorClubActionCreateStream"] = 15,
                ["ErrorClubActionEditMemberNote"] = 20,
                ["ErrorClubActionDestroy"] = 3,
                ["ErrorClubActionSubscribe"] = 0,
                ["ErrorClubActionEditStream"] = 16,
                ["ErrorClubActionEditMember"] = 19,
                ["ErrorClubActionCreate"] = 1,
                ["ErrorClubActionKickMember"] = 21,
                ["ErrorClubActionEditMessage"] = 25,
                ["ErrorClubActionRemoveBan"] = 23,
            },
            ["ContributionAppearanceFlags"] = {
                ["TooltipUseTimeRemaining"] = 0,
            },
            ["StoreDeliveryType"] = {
                ["Collection"] = 3,
                ["Mount"] = 1,
                ["Item"] = 0,
                ["Battlepet"] = 2,
            },
            ["PerfCounterMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["SelfResurrectOptionTypeMeta"] = {
                ["NumValues"] = 2,
                ["MinValue"] = 0,
                ["MaxValue"] = 1,
            },
            ["VasServiceTypeMeta"] = {
                ["NumValues"] = 6,
                ["MinValue"] = 0,
                ["MaxValue"] = 5,
            },
            ["ContributionAppearanceFlagsMeta"] = {
                ["NumValues"] = 1,
                ["MinValue"] = 0,
                ["MaxValue"] = 0,
            },
            ["MapCanvasPosition"] = {
                ["TopLeft"] = 3,
                ["BottomRight"] = 2,
                ["TopRight"] = 4,
                ["BottomLeft"] = 1,
                ["None"] = 0,
            },
            ["ItemQuality"] = {
                ["WoWToken"] = 8,
                ["Poor"] = 0,
                ["Standard"] = 1,
                ["Legendary"] = 5,
                ["Heirloom"] = 7,
                ["Epic"] = 4,
                ["Superior"] = 3,
                ["Artifact"] = 6,
                ["Good"] = 2,
            },
            ["TransmogSourceMeta"] = {
                ["NumValues"] = 10,
                ["MinValue"] = 0,
                ["MaxValue"] = 9,
            },
            ["ModelSceneSetting"] = {
                ["AlignLightToOrbitDelta"] = 1,
            },
            ["VignetteTypeMeta"] = {
                ["NumValues"] = 2,
                ["MinValue"] = 0,
                ["MaxValue"] = 1,
            },
            ["CharacterServiceInfoFlag"] = {
                ["RestrictToRecommendedSpecs"] = 1,
            },
            ["QuestTagMeta"] = {
                ["NumValues"] = 10,
                ["MinValue"] = 0,
                ["MaxValue"] = 102,
            },
            ["FlightPathStateMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["ContributionResultMeta"] = {
                ["NumValues"] = 8,
                ["MinValue"] = 0,
                ["MaxValue"] = 7,
            },
            ["VoiceChatStatusCode"] = {
                ["AlreadyInChannel"] = 10,
                ["UnsupportedChatChannelType"] = 19,
                ["LoginProhibited"] = 3,
                ["ChannelNameTooShort"] = 7,
                ["ProxyConnectionTimeOut"] = 15,
                ["ClientNotLoggedIn"] = 5,
                ["TooManyRequests"] = 2,
                ["InvalidCommunityStream"] = 20,
                ["ClientNotInitialized"] = 4,
                ["ChannelAlreadyExists"] = 9,
                ["PlayerVoiceChatParentalDisabled"] = 22,
                ["ClientAlreadyLoggedIn"] = 6,
                ["TargetNotFound"] = 11,
                ["ProxyConnectionUnableToConnect"] = 16,
                ["Disabled"] = 18,
                ["OperationPending"] = 1,
                ["ServiceLost"] = 13,
                ["Success"] = 0,
                ["Failure"] = 12,
                ["ProxyConnectionUnexpectedDisconnect"] = 17,
                ["ChannelNameTooLong"] = 8,
                ["UnableToLaunchProxy"] = 14,
                ["PlayerSilenced"] = 21,
            },
            ["PowerType"] = {
                ["Mana"] = 0,
                ["Focus"] = 2,
                ["None"] = -1,
                ["RunicPower"] = 6,
                ["ComboPoints"] = 4,
                ["Energy"] = 3,
                ["Runes"] = 5,
                ["Maelstrom"] = 11,
                ["LunarPower"] = 8,
                ["Obsolete"] = 14,
                ["HolyPower"] = 9,
                ["SoulShards"] = 7,
                ["HealthCost"] = -2,
                ["Chi"] = 12,
                ["Alternate"] = 10,
                ["Insanity"] = 13,
                ["Rage"] = 1,
                ["Fury"] = 17,
                ["Obsolete2"] = 15,
                ["ArcaneCharges"] = 16,
                ["NumPowerTypes"] = 19,
                ["Pain"] = 18,
            },
            ["ClubStreamNotificationFilter"] = {
                ["Mention"] = 1,
                ["All"] = 2,
                ["None"] = 0,
            },
            ["UIMapSystem"] = {
                ["Taxi"] = 1,
                ["World"] = 0,
                ["Adventure"] = 2,
            },
            ["VasPurchaseProgress"] = {
                ["PrePurchase"] = 1,
                ["ProcessingFactionChange"] = 6,
                ["Ready"] = 5,
                ["Invalid"] = 0,
                ["WaitingOnQueue"] = 4,
                ["ApplyingLicense"] = 3,
                ["PaymentPending"] = 2,
                ["Complete"] = 7,
            },
            ["UIMapSystemMeta"] = {
                ["NumValues"] = 3,
                ["MinValue"] = 0,
                ["MaxValue"] = 2,
            },
            ["ClubActionTypeMeta"] = {
                ["NumValues"] = 27,
                ["MinValue"] = 0,
                ["MaxValue"] = 26,
            },
            ["ConsoleCommandType"] = {
                ["Command"] = 1,
                ["Cvar"] = 0,
                ["Script"] = 2,
            },
            ["ClubStreamType"] = {
                ["Other"] = 3,
                ["Guild"] = 1,
                ["General"] = 0,
                ["Officer"] = 2,
            },
        }
    end

    -- Evite de recharger les scripts déjà chargés
    local noSharedXML = nocase [[^..\..\SharedXML\]]
    local noFrameXML  = nocase [[^..\..\FrameXML\]]

    -- Exécute un script dans notre environnement clos
    local function runScript(script, name, tbl)
        local f, err = loadfile(script)
        if err then error(err) end

        setfenv(f, env)
        f(name, tbl)
    end

    -- Exécute un addon dans notre environnement clos
    local function runAddOn(addonData)
        -- print(addonData.name)

        -- Celui-ci pose problème, on verra plus tard...
        if addonData.name == 'Blizzard_StoreUI' then return end

        assert(lfs.chdir(ADDONS_PATH / addonData.name))
        for _, file in ipairs(addonData.files) do
            -- Certains addons rechargent des parties de FrameXML ou SharedXML :(
            if file:match(noSharedXML) or file:match(noFrameXML) then
                runScript(file, addonData.name, nil)
            else
                runScript(file, addonData.name, addonData.tbl)
            end
        end
        assert(lfs.chdir(cwd))
    end

    -- Les chaînes sont incluses implicitement par le jeu, donc manuellement par nous
    assert(lfs.chdir(INTERFACE_PATH))
    runScript([[..\GlobalStrings.lua]])
    assert(lfs.chdir(cwd))

    -- D'abord le FrameXML
    assert(lfs.chdir(FRAMEXML_PATH))
    for _, script in ipairs(scripts.framexml.files) do
        runScript(script)
    end
    runScript([[MainMenuBarMicroButtons.lua]])  -- Utilisé par les addons mais semble avoir été oublié dans le FrameXML.toc
    assert(lfs.chdir(cwd))

    -- Puis les addons (utilise un algo très sommaire pour gérer les dépendences, mais qui suffira bien ici)
    -- 1ère passe : tous ceux qui n'ont PAS de dépendence
    local loaded, i = {}, 0
    for _,addonData in ipairs(scripts.addons) do
        if not addonData.deps and not addonData.optDeps then
            runAddOn(addonData)
            loaded[addonData.name] = 1
            i = i + 1
        end
    end

    -- 2ème passe : les autres, jusqu'à ce qu'on aie tout chargé
    while i < #scripts.addons do
        local function deps_loaded(deps)
            local ok = true
            for i in string.gmatch(deps, "[%a_]+") do
                if not loaded[i] then
                    ok = false
                    break
                end
             end
             return ok
        end

        for _,addonData in ipairs(scripts.addons) do
            local can_load = false
            if addonData.deps and addonData.optDeps then
                can_load = deps_loaded(addonData.deps) and deps_loaded(addonData.optDeps)
            elseif addonData.deps then
                can_load = deps_loaded(addonData.deps)
            elseif addonData.optDeps then
                can_load = deps_loaded(addonData.optDeps)
            end

            if can_load then
                runAddOn(addonData)
                loaded[addonData.name] = 1
                i = i + 1
            end
        end
    end
    lfs.chdir(cwd)
end

-------------------------------------------------------------------------------
-- 4) Met le fichier ..\db.lua à jour
-------------------------------------------------------------------------------
do
    -- TODO: Importe le fichier actuel
    local globals = {
        [FRAMEXML_BUILD] = {
            version   = FRAMEXML_VERSION,
            functions = {},
            tables    = {},
            strings   = {},
            numbers   = {}
        },
    }

    -- Met tout ça en forme avant de l'enregistrer
    local types = {
        f = globals[FRAMEXML_BUILD].functions,
        t = globals[FRAMEXML_BUILD].tables,
        s = globals[FRAMEXML_BUILD].strings,
        n = globals[FRAMEXML_BUILD].numbers,
        _ = {}
    }

    local map = {
        ['function'] = 'f',
        ['table']    = 't',
        ['string']   = 's',
        ['number']   = 'n',
        ['boolean']  = 'n',
        ['nil']      = '_',
        ['thread']   = '_',
        ['userdata'] = '_',
    }

    for k, v in pairs(env) do
        types[map[type(v)]][k] = 1
    end

    local db, err = io.open([[..\db_test.lua]], 'w') -- TODO: utiliser DB_FILE
    if err then error(err) end
    db:write('globals = ')
    db:write(serpent.block(globals, { comment = false, nocode = true, --[[ maxlevel = 3, ]] indent = '\t' } ))
    db:write('\n')
    db:close()
end

print('Fini !')
