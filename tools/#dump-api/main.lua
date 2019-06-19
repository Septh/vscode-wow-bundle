
-- Environnement
local addonName, addon = ...

-- Upvalues
local CreateFrame = CreateFrame
local GetNumAddOns, IsAddOnLoaded, GetAddOnInfo = GetNumAddOns, IsAddOnLoaded, GetAddOnInfo
local GetBuildInfo = GetBuildInfo

local C_UI = C_UI

-------------------------------------------------------------------------------
-- Initialisation
-------------------------------------------------------------------------------
local f = CreateFrame('Frame')
f:SetScript('OnEvent', function(self, event, ...)
    if type(addon[event]) == 'function' then addon[event](addon, ...) end
end)

f:RegisterEvent('PLAYER_ENTERING_WORLD')
function addon:PLAYER_ENTERING_WORLD(isLogin, isReload)
    self:Initialize()
end

-- /rui
SlashCmdList['SLASH_RUI'] = function()
    local f = _G.SlashCmdList['SWATTER']
    if type(f) == 'function' then f('clear') end
    C_UI.Reload()
end
_G.SLASH_RUI1 = '/rui'

-------------------------------------------------------------------------------
-- S'assure qu'aucun autre addon n'est chargé
-------------------------------------------------------------------------------
local AddOnsWhiteList = {
    [addonName] = 1,
    ['!Swatter'] = 1
}

function addon:Initialize()

    local numAddons = GetNumAddOns()
    for idx = 1, numAddons do
        local name = GetAddOnInfo(idx)
        local isLoaded = IsAddOnLoaded(idx)
        if isLoaded and not AddOnsWhiteList[name] then
            print('#'..idx..'>', name, '=>', isLoaded)
        end
    end

    _G['GlobalAPI'] = {
        build = { GetBuildInfo() },
        functions = {},
        tables = {}
    }
    self.sv = _G['GlobalAPI']
end

--[=[
-------------------------------------------------------------------------------
-- Identifie toutes les fonctions globales de l'API
-------------------------------------------------------------------------------
local _ignores = {
    'Frame_.+$', 'Panel_.+$', 'Pool_.+$', 'DropDown_.+$', 'Menu_.+$','Bar_.+$', 'Template_.+$', 'Button_.+$',
    'Tracker_.+$', 'CombatLog_.+$', 'Banner_.+$', 'Edit_.+$', 'Config_.+$', 'History_.+$',
    'List_.+$', 'Chat_.+$', 'Container_.+$', 'Manager_.+$', 'Box_.+$',
    '_On.+$',   -- _OnLoad, _OnShow, _OnEvent, etc.
    '_Show$', '_Hide$', '_Update$', '_Accept$', '_LoadUI$',
    'ActionBar.+$', 'ActionButton.+$', 'ActionStatus.+$', 'ActionPool.+$',
    'Abbreviate', 'Advanced', 'AlertFrameSystems', 'AnimatedShine', 'AutoCastShine',
    'AutoComplete', 'BNet_', 'BoostTutorial', 'Browser_', 'ButtonPulse_', 'CRF_',
    'CatmullRom_'
}

local function include(s)
    for _, v in ipairs(_ignores) do
        if s:find(v) then return false end
    end
    return true
end

-------------------------------------------------------------------------------
-- Initialisation du addon
-------------------------------------------------------------------------------
--[[ for k,v in pairs(_G) do
    if type(v) == 'function' then
    elseif type(v) === 'table' then
    else
    end
end
 ]]
--]=]
