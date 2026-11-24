local cfg = BahiaPortalWL
local busy = false
local seen = {}

local function sendComplete(requestId, success, message)
    local payload = toJSON({ id = requestId, success = success, error = message or "" }, true)
    fetchRemote(cfg.completeUrl, {
        method = "POST",
        headers = { ["Content-Type"] = "application/json", ["X-MTA-Token"] = cfg.token },
        postData = payload,
        connectionAttempts = 3,
        connectTimeout = 10000
    }, function(response, errno, responseInfo)
        if errno == 0 and responseInfo and responseInfo.success then
            outputDebugString("[BahiaPortalWL] Status atualizado: " .. tostring(requestId))
        else
            outputDebugString("[BahiaPortalWL] Falha ao atualizar status: " .. tostring(errno) .. " / " .. tostring(responseInfo and responseInfo.statusCode), 2)
        end
    end)
end

local function processRequest(row)
    if type(row) ~= "table" or not row.id or not row.player_id then return end
    local id = tonumber(row.player_id)
    if not id or id < 1 or id % 1 ~= 0 then
        sendComplete(row.id, false, "ID inválido recebido pela API")
        return
    end
    if seen[tostring(row.id)] then return end
    seen[tostring(row.id)] = true

    -- O comando addwl precisa existir e aceitar execução pelo servidor.
    local ok = executeCommandHandler("addwl", false, tostring(id))
    if ok then
        outputDebugString("[BahiaPortalWL] Comando addwl executado para ID " .. id)
        sendComplete(row.id, true)
    else
        outputDebugString("[BahiaPortalWL] addwl não executado para ID " .. id, 2)
        sendComplete(row.id, false, "Comando addwl não encontrado ou execução recusada")
        seen[tostring(row.id)] = nil
    end
end

local function poll()
    if busy then return end
    busy = true
    fetchRemote(cfg.pollUrl, {
        method = "GET",
        headers = { ["X-MTA-Token"] = cfg.token },
        connectionAttempts = 3,
        connectTimeout = 10000
    }, function(response, errno, responseInfo)
        busy = false
        if errno ~= 0 or not responseInfo or not responseInfo.success then
            outputDebugString("[BahiaPortalWL] Poll falhou: " .. tostring(errno) .. " / " .. tostring(responseInfo and responseInfo.statusCode), 2)
            return
        end
        local data = fromJSON(response)
        if not data or type(data.requests) ~= "table" then
            outputDebugString("[BahiaPortalWL] Resposta JSON inesperada", 2)
            return
        end
        for _, row in ipairs(data.requests) do processRequest(row) end
    end)
end

addEventHandler("onResourceStart", resourceRoot, function()
    outputDebugString("[BahiaPortalWL] Iniciado. Integração de pedidos de ID ativa.")
    poll()
    setTimer(poll, cfg.pollIntervalMs or 15000, 0)
end)
