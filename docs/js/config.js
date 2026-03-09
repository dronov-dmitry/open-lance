// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    ENV: 'PROD',
    API: {
        development: { baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev' },
        production: { baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev' }
    },
    SETTINGS: { maxContactLinks: 10, defaultPageSize: 20, retryAttempts: 3, retryDelay: 1000 },
    turnstileSiteKey: '0x4AAAAAACoPG9Z-dUnLl6t1'
};

function getConfig() {
    const env = CONFIG.ENV || 'development';
    let fallbackURL = CONFIG.API?.production?.baseURL || 'https://open-lance-backend.dronov-dmitry-bim.workers.dev';
    if (env === 'local' || env === 'development') fallbackURL = 'http://127.0.0.1:8787';
    const apiConfig = CONFIG.API[env] || { baseURL: fallbackURL };
    return {
        apiBaseURL: apiConfig.baseURL,
        ...CONFIG.SETTINGS,
        turnstileSiteKey: CONFIG.turnstileSiteKey || ''
    };
}

window.APP_CONFIG = getConfig();
