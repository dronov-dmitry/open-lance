// API Service - Handles all HTTP requests to backend
class APIService {
    constructor() {
        this.baseURL = window.APP_CONFIG.apiBaseURL;
        this.retryAttempts = window.APP_CONFIG.retryAttempts;
        this.retryDelay = window.APP_CONFIG.retryDelay;
    }

    // Get auth token from memory
    // Get auth token from memory or localStorage
    getAuthToken() {
        return window.authToken || localStorage.getItem('authToken');
    }

    // Set auth token in memory
    setAuthToken(token) {
        window.authToken = token;
    }

    // Clear auth token
    clearAuthToken() {
        window.authToken = null;
    }

    // Check if API is available
    async checkHealth() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${this.baseURL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                return { available: true, data };
            }
            return { available: false, error: `Health check returned ${response.status}` };
        } catch (error) {
            if (error.name === 'AbortError') {
                return { available: false, error: 'API не отвечает (таймаут 5с)' };
            }
            return { available: false, error: error.message };
        }
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
                    if (errorData.details && Array.isArray(errorData.details)) {
                        // Map english validation details to Russian
                        const translatedDetails = errorData.details.map(detail => {
                            if (detail.includes('Deadline must be in the future')) return 'Срок выполнения должен быть в будущем (начиная с завтрашнего дня)';
                            if (detail.includes('title') || detail.includes('Title')) return 'Слишком короткое или длинное название/должность (макс 100 символов)';
                            if (detail.includes('description')) return 'Слишком короткое описание';
                            if (detail.includes('budget')) return 'Некорректный бюджет';
                            if (detail.includes('Name must be')) return 'Имя не должно превышать 100 символов';
                            if (detail.includes('Bio must be')) return 'Поле "О себе" не должно превышать 1000 символов';
                            if (detail.includes('Invalid avatar URL')) return 'Неверный формат ссылки на изображение (должен быть URL)';
                            if (detail.includes('Avatar URL is too long')) return 'Ссылка на аватар слишком длинная (макс 500 символов)';
                            return detail; // fallback
                        });
                        errorMessage = translatedDetails.join('\n');
                    } else if (errorData.error?.details && Array.isArray(errorData.error.details)) {
                        // Handle wrapped error format with details array
                        const translatedDetails = errorData.error.details.map(detail => {
                            if (detail.includes('Name must be')) return 'Имя не должно превышать 100 символов';
                            if (detail.includes('Title must be')) return 'Должность не должна превышать 100 символов';
                            if (detail.includes('Bio must be')) return 'Поле "О себе" не должно превышать 1000 символов';
                            if (detail.includes('Invalid avatar URL')) return 'Неверный формат ссылки на аватар (должен начинаться с http/https)';
                            if (detail.includes('Avatar URL is too long')) return 'Ссылка на аватар слишком длинная (макс 500 символов)';
                            return detail;
                        });
                        errorMessage = translatedDetails.join('\n');
                    } else if (typeof errorData.error === 'string') {
                        errorMessage = errorData.error;
                    } else if (errorData.error?.message) {
                        errorMessage = errorData.error.message;
                    } else if (errorData.message) {
                        errorMessage = errorData.message;
                    } else {
                        errorMessage = 'Не удалось выполнить запрос';
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
                    console.error(`[${timeoutTime}] [API] Base URL:`, this.baseURL);
                    
                    // Check if API is available
                    const healthCheck = await this.checkHealth();
                    if (!healthCheck.available) {
                        throw new Error(`API недоступен: ${healthCheck.error}. Проверьте, что backend развернут и доступен по адресу ${this.baseURL}`);
                    }
                    
                    throw new Error('Запрос превысил время ожидания. Возможно, проблема с подключением к базе данных. Пожалуйста, попробуйте позже.');
                }
                throw fetchError;
            }
        } catch (error) {
            console.error('API Request Error:', error);
            console.error('[API] Base URL:', this.baseURL);
            console.error('[API] Endpoint:', endpoint);
            console.error('[API] Full URL:', `${this.baseURL}${endpoint}`);
            console.error('[API] Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
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

    async changePassword(oldPassword, newPassword) {
        return this.post('/auth/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });
    }

    async resendVerificationEmail(email) {
        // This is a public endpoint, don't add auth token
        const timestamp = new Date().toISOString();
        const url = `${this.baseURL}/auth/resend-verification`;
        console.log(`[${timestamp}] [API] Verification email resend request`);
        console.log(`[${timestamp}] [API] URL:`, url);
        console.log(`[${timestamp}] [API] Email:`, email);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        try {
            // Explicitly ensure no Authorization header is sent
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Make sure we're not adding any auth token
            console.log(`[${timestamp}] [API] Request headers:`, headers);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ email }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            console.log(`[${timestamp}] [API] Response status:`, response.status);
            console.log(`[${timestamp}] [API] Response ok:`, response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.log(`[${timestamp}] [API] Error response status:`, response.status);
                console.log(`[${timestamp}] [API] Error response text:`, errorText);
                let errorData;
                try {
                    errorData = JSON.parse(errorText);
                    console.log(`[${timestamp}] [API] Parsed error data:`, errorData);
                } catch {
                    console.log(`[${timestamp}] [API] Could not parse error as JSON`);
                    throw new Error(errorText || `HTTP ${response.status}`);
                }
                
                // Приоритет: message > error > общее сообщение
                const errorMessage = errorData.message || errorData.error || 'Ошибка при отправке письма';
                console.log(`[${timestamp}] [API] Throwing error:`, errorMessage);
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log(`[${timestamp}] [API] Success response:`, data);
            
            // Если есть предупреждение, показываем его пользователю
            if (data.warning) {
                console.warn(`[${timestamp}] [API] Warning:`, data.warning);
            }
            
            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            console.error(`[${timestamp}] [API] Verification email resend error:`, error);
            if (error.name === 'AbortError') {
                throw new Error('Запрос превысил время ожидания. Попробуйте позже.');
            }
            throw error;
        }
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

    async getUsers(filters = {}) {
        const params = new URLSearchParams();
        if (filters.specialization) params.append('specialization', filters.specialization);
        if (filters.search) params.append('search', filters.search);
        if (filters.sortBy) params.append('sortBy', filters.sortBy);
        if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
        const queryString = params.toString();
        return this.get('/users' + (queryString ? '?' + queryString : ''));
    }

    async getSpecializations() {
        return this.get('/users/specializations');
    }

    async updateUserRole(targetUserId, newRole) {
        return this.put('/admin/users/role', {
            data: { targetUserId, newRole }
        });
    }

    async updateUserStatus(targetUserId, newStatus) {
        return this.put('/admin/users/ban', {
            data: { targetUserId, newStatus }
        });
    }

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

    async submitReview(userId, rating, comment) {
        return this.post(`/users/${userId}/reviews`, {
            data: { rating, comment }
        });
    }

    async getReviews(userId) {
        return this.get(`/users/${userId}/reviews`);
    }

    // ===== Review Endpoints =====

    async getProfileReviews(userId) {
        return this.get(`/users/${userId}/reviews`);
    }

    async canReviewUser(userId) {
        return this.get(`/users/${userId}/reviews/can-review`);
    }

    async submitProfileReview(userId, rating, comment) {
        return this.post(`/users/${userId}/reviews`, {
            data: { rating, comment }
        });
    }

    async updateProfileReview(userId, reviewId, rating, comment) {
        return this.put(`/users/${userId}/reviews/${reviewId}`, {
            data: { rating, comment }
        });
    }

    // ===== Message Endpoints =====

    async sendMessage(receiverId, content) {
        return this.post('/messages', {
            data: { receiverId, content }
        });
    }

    // ===== Application Endpoints =====

    async getApplications(taskId) {
        return this.get(`/applications/task/${taskId}`);
    }

    async getMyApplications() {
        return this.get('/applications/me');
    }

    async updateApplicationMessage(applicationId, message) {
        return this.put(`/applications/${applicationId}/message`, {
            message: message
        });
    }

    async deleteApplication(applicationId) {
        return this.delete(`/applications/${applicationId}`);
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
        getMyApplications: () => Promise.reject(new Error('API not initialized')),
        login: () => Promise.reject(new Error('API not initialized')),
        register: () => Promise.reject(new Error('API not initialized')),
        createTask: () => Promise.reject(new Error('API not initialized')),
        getProfile: () => Promise.reject(new Error('API not initialized')),
        updateProfile: () => Promise.reject(new Error('API not initialized')),
        getTask: () => Promise.reject(new Error('API not initialized'))
    };
}
