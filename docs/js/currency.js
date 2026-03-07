/**
 * Currency Service
 * Handles exchange rates and currency conversion
 */
class CurrencyService {
    constructor() {
        this.baseCurrency = 'RUB'; // All budgets in the app are stored in RUB
        this.availableCurrencies = ['RUB', 'USD', 'EUR', 'UAH'];
        // Default formatter options per currency
        this.currencyOptions = {
            'RUB': { locale: 'ru-RU', options: { style: 'currency', currency: 'RUB', minimumFractionDigits: 0, maximumFractionDigits: 0 } },
            'USD': { locale: 'en-US', options: { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 2 } },
            'EUR': { locale: 'en-IE', options: { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 } },
            'UAH': { locale: 'uk-UA', options: { style: 'currency', currency: 'UAH', minimumFractionDigits: 0, maximumFractionDigits: 0 } }
        };

        this.rates = null;
        this.lastFetchTime = null;
        this.cacheKey = 'open_lance_exchange_rates';
        this.preferenceKey = 'open_lance_currency_pref';
        
        // TTL in milliseconds (12 hours)
        this.cacheTTL = 12 * 60 * 60 * 1000;
    }

    /**
     * Get user's preferred currency
     * @returns {string} Currency code (e.g., 'RUB', 'USD')
     */
    getPreferredCurrency() {
        const pref = localStorage.getItem(this.preferenceKey);
        if (pref && this.availableCurrencies.includes(pref)) {
            return pref;
        }
        return this.baseCurrency;
    }

    /**
     * Set user's preferred currency
     * @param {string} currencyCode 
     */
    setPreferredCurrency(currencyCode) {
        if (this.availableCurrencies.includes(currencyCode)) {
            localStorage.setItem(this.preferenceKey, currencyCode);
            // Trigger an event so UI can re-render if needed
            window.dispatchEvent(new CustomEvent('currencyChanged', { detail: { currency: currencyCode } }));
        }
    }

    /**
     * Load rates from cache or fetch from API
     */
    async init() {
        try {
            this.loadFromCache();
            if (this.needsRefresh()) {
                await this.fetchRates();
            }
        } catch (error) {
            console.error('[CurrencyService] Failed to initialize:', error);
            // Defaults to 1:1 if fails completely
            if (!this.rates) {
                this.rates = { 'RUB': 1, 'USD': 0.011, 'EUR': 0.010, 'UAH': 0.43 }; 
            }
        }
    }

    loadFromCache() {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                if (data.rates && data.timestamp) {
                    this.rates = data.rates;
                    this.lastFetchTime = data.timestamp;
                    console.log('[CurrencyService] Loaded rates from cache');
                }
            } catch (e) {
                console.warn('[CurrencyService] Corrupt cache data');
            }
        }
    }

    needsRefresh() {
        if (!this.rates || !this.lastFetchTime) return true;
        const now = Date.now();
        return (now - this.lastFetchTime) > this.cacheTTL;
    }

    async fetchRates() {
        try {
            console.log(`[CurrencyService] Fetching fresh rates for ${this.baseCurrency}...`);
            // ExchangeRate-API (Free tier, no key required for basic endpoint)
            const response = await fetch(`https://open.er-api.com/v6/latest/${this.baseCurrency}`);
            
            if (!response.ok) {
                throw new Error(`API returned ${response.status}`);
            }

            const data = await response.json();
            
            if (data.result === 'success' && data.rates) {
                this.rates = data.rates;
                this.lastFetchTime = Date.now();
                
                // Save to cache
                localStorage.setItem(this.cacheKey, JSON.stringify({
                    rates: this.rates,
                    timestamp: this.lastFetchTime
                }));
                console.log('[CurrencyService] Fresh rates fetched and cached successfully');
            } else {
                throw new Error('Invalid data format from API');
            }
        } catch (error) {
            console.error('[CurrencyService] Error fetching exchange rates:', error);
            // If we have stale cache, it's better than nothing, so we just log the error.
        }
    }

    /**
     * Convert an amount from base currency to preferred currency and format it
     * @param {number} amount Amount in base currency (RUB)
     * @returns {string} Formatted string
     */
    formatAmount(amount) {
        if (amount === undefined || amount === null || isNaN(amount)) {
            return '—';
        }

        const preferred = this.getPreferredCurrency();
        
        // Convert logic
        let convertedAmount = amount;
        
        if (preferred !== this.baseCurrency && this.rates && this.rates[preferred]) {
            convertedAmount = amount * this.rates[preferred];
        }

        // Format logic
        const config = this.currencyOptions[preferred] || this.currencyOptions[this.baseCurrency];
        
        try {
            return new Intl.NumberFormat(config.locale, config.options).format(convertedAmount);
        } catch (e) {
            console.error('[CurrencyService] Formatting error:', e);
            // Fallback
            return convertedAmount.toFixed(2) + ' ' + preferred;
        }
    }
}

// Initialize global instance
window.currencyService = new CurrencyService();
