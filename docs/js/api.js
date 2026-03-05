// API Service - Handles all HTTP requests to backend
class APIService {
    constructor() {
        this.baseURL = window.APP_CONFIG.apiBaseURL;
        this.retryAttempts = window.APP_CONFIG.retryAttempts;
        this.retryDelay = window.APP_CONFIG.retryDelay;
    }

    // Get auth token from memory
    getAuthToken() {
        return window.authToken || null;
    }

    // Set auth token in memory (never in localStorage for security)
    setAuthToken(token) {
        window.authToken = token;
    }

    // Clear auth token
    clearAuthToken() {
        window.authToken = null;
    }

    // Make HTTP request with retry logic
    async request(endpoint, options = {}, attempt = 1) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [API] Request attempt ${attempt} to: ${endpoint}`);
        
        const token = this.getAuthToken();
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const fetchTime = new Date().toISOString();
            console.log(`[${fetchTime}] [API] Fetching: ${this.baseURL}${endpoint}`, config);
            
            // Add timeout wrapper (15 seconds)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);
            
            try {
                const response = await fetch(`${this.baseURL}${endpoint}`, {
                    ...config,
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                
                const responseTime = new Date().toISOString();
                console.log(`[${responseTime}] [API] Response received:`, { status: response.status, ok: response.ok });

            // Handle different status codes
            if (response.status === 401) {
                // Unauthorized - redirect to login
                this.clearAuthToken();
                window.dispatchEvent(new CustomEvent('auth:logout'));
                throw new Error('Unauthorized');
            }

            if (response.status === 429) {
                // Rate limited - retry with exponential backoff
                if (attempt <= this.retryAttempts) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    await this.sleep(delay);
                    return this.request(endpoint, options, attempt + 1);
                }
                throw new Error('Too many requests. Please try again later.');
            }

            if (response.status === 500) {
                // Server error - retry
                if (attempt <= this.retryAttempts) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1);
                    await this.sleep(delay);
                    return this.request(endpoint, options, attempt + 1);
                }
                throw new Error('Server error. Please try again later.');
            }

            if (!response.ok) {
                const errorStartTime = new Date().toISOString();
                console.log(`[${errorStartTime}] [API] Response not OK, reading error...`);
                const errorText = await response.text();
                const errorReadTime = new Date().toISOString();
                console.error(`[${errorReadTime}] [API] Error response status:`, response.status);
                console.error(`[${errorReadTime}] [API] Error response body:`, errorText);
                try {
                    const errorData = JSON.parse(errorText);
                    console.log(`[${errorReadTime}] [API] Parsed error data:`, errorData);
                    
                    // Handle multiple formats:
                    // 1. {error: "message"}  <- New simple format
                    // 2. {success: false, error: {message: "..."}}  <- Old wrapped format
                    // 3. {message: "..."}  <- Direct message
                    let errorMessage;
                    if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    } else if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else {
                        errorMessage = 'Request failed';
                    }
                    
                    console.log('[API] Throwing error:', errorMessage);
                    throw new Error(errorMessage);
                } catch (e) {
                    console.log('[API] Error parsing/throwing:', e);
                    if (e.message && e.message !== errorText) {
                        throw e; // Re-throw if it's our formatted error
                    }
                    throw new Error('Request failed');
                }
            }

                console.log('[API] Response OK, parsing JSON...');
                const data = await response.json();
                console.log('[API] Parsed data:', data);
                return data;
            } catch (fetchError) {
                clearTimeout(timeoutId);
                if (fetchError.name === 'AbortError') {
                    const timeoutTime = new Date().toISOString();
                    console.error(`[${timeoutTime}] [API] Request timeout (15s) for:`, endpoint);
                    throw new Error('Запрос превысил время ожидания. Пожалуйста, попробуйте позже.');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    // Helper: sleep function for retry delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    // POST request
    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // PUT request
    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    // DELETE request
    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    // ===== Auth Endpoints =====

    async register(email, password) {
        return this.post('/auth/register', {
            email,
            password
        });
    }

    async login(email, password) {
        return this.post('/auth/login', {
            email,
            password
        });
    }

    // ===== Task Endpoints =====

    async getTasks(filters = {}) {
        const queryString = new URLSearchParams(filters).toString();
        return this.get(`/tasks${queryString ? '?' + queryString : ''}`);
    }

    async getTask(taskId) {
        return this.get(`/tasks/${taskId}`);
    }

    async createTask(taskData) {
        return this.post('/tasks', {
            action: 'create_task',
            data: taskData
        });
    }

    async updateTask(taskId, taskData) {
        return this.put(`/tasks/${taskId}`, {
            action: 'update_task',
            data: taskData
        });
    }

    async deleteTask(taskId) {
        return this.delete(`/tasks/${taskId}`);
    }

    async applyToTask(taskId, message) {
        return this.post(`/tasks/${taskId}/apply`, {
            action: 'apply_to_task',
            data: { message }
        });
    }

    async matchWorker(taskId, workerId) {
        return this.post(`/tasks/${taskId}/match`, {
            action: 'match_worker',
            data: { worker_id: workerId }
        });
    }

    async completeTask(taskId) {
        return this.post(`/tasks/${taskId}/complete`, {
            action: 'complete_task'
        });
    }

    async cancelTask(taskId) {
        return this.post(`/tasks/${taskId}/cancel`, {
            action: 'cancel_task'
        });
    }

    // ===== User/Profile Endpoints =====

    async getProfile(userId = 'me') {
        return this.get(`/users/${userId}`);
    }

    async updateProfile(profileData) {
        return this.put('/users/me', {
            action: 'update_profile',
            data: profileData
        });
    }

    async addContactLink(link) {
        return this.post('/users/me/contacts', {
            action: 'add_contact_link',
            data: link
        });
    }

    async removeContactLink(linkId) {
        return this.delete(`/users/me/contacts/${linkId}`);
    }

    // ===== Review Endpoints =====

    async submitReview(taskId, rating, comment) {
        return this.post(`/tasks/${taskId}/review`, {
            action: 'submit_review',
            data: { rating, comment }
        });
    }

    async getReviews(userId) {
        return this.get(`/users/${userId}/reviews`);
    }

    // ===== Application Endpoints =====

    async getApplications(taskId) {
        return this.get(`/tasks/${taskId}/applications`);
    }

    async getMyApplications() {
        return this.get('/applications/me');
    }
}

// Create global API instance
try {
    window.api = new APIService();
    console.log('[API] APIService initialized successfully', window.api);
} catch (error) {
    console.error('[API] Failed to initialize APIService:', error);
    console.error('[API] APP_CONFIG:', window.APP_CONFIG);
    // Create a dummy API to prevent crashes
    window.api = {
        getTasks: () => Promise.reject(new Error('API not initialized')),
        getMyApplications: () => Promise.reject(new Error('API not initialized'))
    };
}
