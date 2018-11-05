--
-- Path to the API documentation (ie. the Blizzard_APIDocumentation folder) on your system
--
local BLIZZARD_API_DOCUMENTATION_PATH = [[D:\Dev\WoW\!!BlizzardInterfaceCode\Interface 8.1.0\Blizzard_APIDocumentation\]]

--
-- Mimic some parts of the Blizzard's API so that the documentation API works outside of WoW
--
function Mixin(object, ...)
    for i = 1, select("#", ...) do
        local mixin = select(i, ...)
        for k, v in pairs(mixin) do
            object[k] = v
        end
    end
    return object
end

function CreateFromMixins(...)
    return Mixin({}, ...)
end

function string:split(str)
    -- Usage is delimiter:split(sourceString)
    local result = {}
    for match in (str .. self):gmatch("(.-)" .. self) do
        table.insert(result, match)
    end
    return unpack(result)
end

--
-- Import and patch the documentation mixins
--
do
    local BLIZZARD_API_DOCUMENTATION_TOC  = BLIZZARD_API_DOCUMENTATION_PATH .. [[Blizzard_APIDocumentation.toc]]
    local BLIZZARD_API_DOCUMENTATION_API = {
        'BaseAPIMixin.lua',
        'FieldsAPIMixin.lua',
        'FunctionsAPIMixin.lua',
        'SystemsAPIMixin.lua',
        'TablesAPIMixin.lua',
        'EventsAPIMixin.lua',
        'Blizzard_APIDocumentation.lua'
    }
    for _,sourceFile in ipairs(BLIZZARD_API_DOCUMENTATION_API) do
        dofile(BLIZZARD_API_DOCUMENTATION_PATH .. sourceFile)
    end

    BaseAPIMixin.GenerateAPILink = function(doc)
        return doc:GetFullName()
    end

    FunctionsAPIMixin.GetFullName = function(doc, decorateOptionals, includeColorCodes)
        if doc.System and doc.System:GetNamespaceName() ~= "" then
            return ("%s.%s(%s)"):format(doc.System:GetNamespaceName(), doc:GetName(), doc:GetArgumentString(false, false))
        end
        return ("%s(%s)"):format(doc:GetName(), doc:GetArgumentString(false, false))
    end

    EventsAPIMixin.GetFullName = function(doc, decorateOptionals, includeColorCodes)
        return doc.LiteralName
    end

    FieldsAPIMixin.GetFullName = function(doc)
        if doc:GetParentName() ~= "" then
            return ("%s.%s"):format(doc:GetName(), doc:GetParentName())
        end
        return doc:GetName()
    end

    APIDocumentation.WriteLine = function(doc, msg)
        print(msg)
    end

    --
    -- Read the TOC to import the whole documentation
    --
    local sourceFilesToSkip = {}
    for _,sourceFilename in ipairs(BLIZZARD_API_DOCUMENTATION_API) do sourceFilesToSkip[sourceFilename] = true end

    local toc = assert(io.open(BLIZZARD_API_DOCUMENTATION_TOC, 'r'))
    if toc then
        for sourceFilename in toc:lines() do
            if sourceFilename:len() > 0 and sourceFilename:sub(1,1) ~= '#' and not sourceFilesToSkip[sourceFilename] then
                dofile(BLIZZARD_API_DOCUMENTATION_PATH .. sourceFilename)
            end
        end
        toc:close()
    end
end

if false and #arg > 0 then
    APIDocumentation:HandleSlashCommand(table.concat(arg, ' ')) -- Handle the command
elseif false then
    local function CopyTable(sourceTable)
        local copy = {}
        for k, v in pairs(sourceTable) do
            if (type(v) == "table") then
                copy[k] = CopyTable(v)
            else
                copy[k] = v
            end
        end
        return copy
    end
    local function fullnameSort(a1, a2)
        return a1:GetFullName() < a2:GetFullName()
    end

    local default_data = {
        functions = {},
        events = {}
    }

    -- Load the previous data, in any
    local prev_data = dofile([[Blizzard_APIDocumentation_data.lua]])
    if type(prev_data) ~= 'table' then
        prev_data = CopyTable(default_data)
    end

    -- Get the new data
    local data, apis = CopyTable(default_data), nil

    -- Global functions
    apis = APIDocumentation:GetAPITableByTypeName('function')
    table.sort(apis, fullnameSort)
    for _, api in ipairs(apis) do
        local ns, n, d = api.System and api.System:GetNamespaceName() or "", api:GetName(), data.functions
        if ns ~= "" then
            d[ns] = d[ns] or {}
            d = d[ns]
        end
        d[n] = n
    end

    -- Events
    apis = APIDocumentation:GetAPITableByTypeName('event')
    table.sort(apis, fullnameSort)
    for _, api in ipairs(apis) do
        local n = api:GetFullName()
        data.events[n] = n
    end

    -- Write the result
    local out, err = io.open([[Blizzard_APIDocumentation_data.lua]], "wb")
    if not err then
        local inspect = dofile([[inspect.lua]])
        out:write('return ', inspect(data), '\n')
        out:close()
    end
else
    -- Write the result
    local out, err = io.open([[Blizzard_APIDocumentation_data.lua]], "wb")
    if not err then
        local function fullnameSort(a1, a2)
            return a1:GetFullName() < a2:GetFullName()
        end
        local ns, n, lastns

        -- #1/ Namespaces
        apis = APIDocumentation:GetAPITableByTypeName('function')
        table.sort(apis, fullnameSort)

        for _, api in ipairs(apis) do
            ns, n = api.System and api.System:GetNamespaceName() or "", api:GetName()
            if ns ~= "" then
                if ns ~= lastns then
                    out:write(string.format('\n%s\n', ns))
                    lastns = ns
                end
                out:write(string.format('%s.%s\n', ns, n))
            end
        end
        out:write('\n')

        -- #2/ Global functions
        for _, api in ipairs(apis) do
            ns, n = api.System and api.System:GetNamespaceName() or "", api:GetName()
            if ns == "" then
                out:write(string.format('%s\n', n))
            end
        end
        out:write('\n')

        -- #3/ Events
        apis = APIDocumentation:GetAPITableByTypeName('event')
        table.sort(apis, fullnameSort)

        for _, api in ipairs(apis) do
            out:write(string.format('%q\n', api:GetFullName()))
        end
        out:write('\n')

        out:close()
    end

end
