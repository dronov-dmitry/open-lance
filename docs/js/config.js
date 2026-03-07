// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    ENV: 'PROD',
    API: {
        local:       { baseURL: 'http://127.0.0.1:8787' },
        development: { baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev' },
        production:  { baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev' },
        PROD:        { baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev' }
    },
    SETTINGS: {
        maxContactLinks: 10,
        defaultPageSize: 20,
        retryAttempts: 3,
        retryDelay: 1000
    }
};

function getConfig() {
    const env = CONFIG.ENV || 'development';
    const fallbackURL = (env === 'local')
        ? 'http://127.0.0.1:8787'
        : 'https://open-lance-backend.dronov-dmitry-bim.workers.dev';
    const apiConfig = CONFIG.API[env] || { baseURL: fallbackURL };
    return {
        apiBaseURL: apiConfig.baseURL,
        ...CONFIG.SETTINGS
    };
}

window.APP_CONFIG = getConfig();

