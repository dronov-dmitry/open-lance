// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    // Environment
    ENV: 'dev',
    
    // API Endpoints
    API: {
        development: {
            baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev'
        },
        production: {
            baseURL: 'https://open-lance-backend.dronov-dmitry-bim.workers.dev'
        }
    },
    
    // App Settings
    SETTINGS: {
        maxContactLinks: 10,
        defaultPageSize: 20,
        retryAttempts: 3,
        retryDelay: 1000 // ms
    }
};

// Get current environment config
function getConfig() {
    const env = CONFIG.ENV || 'development';
    
    // Choose fallback based on environment
    let fallbackURL = 'https://open-lance-backend.dronov-dmitry-bim.workers.dev';
    if (env === 'local' || env === 'development') {
        fallbackURL = 'http://127.0.0.1:8787';
    }
    
    const apiConfig = CONFIG.API[env] || { baseURL: fallbackURL };
    return {
        apiBaseURL: apiConfig.baseURL,
        ...CONFIG.SETTINGS
    };
}

// Export for use in other modules
window.APP_CONFIG = getConfig();
