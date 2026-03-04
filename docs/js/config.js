// Configuration for Open-Lance v3.0 (Cloudflare Workers + MongoDB Atlas)
const CONFIG = {
    // Environment
    ENV: 'dev',
    
    // API Endpoints
    API: {
        development: {
            baseURL: 'https://open-lance-backend-dev.<your-subdomain>.workers.dev'
        },
        production: {
            baseURL: 'https://open-lance-backend-dev.<your-subdomain>.workers.dev'
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
    const env = CONFIG.ENV;
    return {
        apiBaseURL: CONFIG.API[env].baseURL,
        ...CONFIG.SETTINGS
    };
}

// Export for use in other modules
window.APP_CONFIG = getConfig();
