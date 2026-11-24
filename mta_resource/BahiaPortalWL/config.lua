BahiaPortalWL = {
    -- Netlify function endpoint do seu domínio
    pollUrl = "https://warm-dusk-5284ac.netlify.app/.netlify/functions/mta-poll",
    completeUrl = "https://warm-dusk-5284ac.netlify.app/.netlify/functions/mta-complete",
    -- Deve ser igual ao MTA_SHARED_TOKEN da Netlify. Não compartilhe este token.
    token = "COLOQUE_O_MESMO_TOKEN_SECRETO_DA_NETLIFY",
    pollIntervalMs = 15000,
}
