// Authentication Service
class AuthService {
    constructor() {
        this.isAuthenticated = false;
        this.currentUser = null;
        this.initEventListeners();
    }

    initEventListeners() {
        // Listen for logout events
        window.addEventListener('auth:logout', () => {
            this.logout();
        });
    }

    // Mock authentication (replace with real Cognito integration)
    async login(email, password) {
        try {
            // TODO: Replace with real AWS Cognito authentication
            // For now, mock authentication
            const response = await window.api.post('/auth/login', {
                email,
                password
            });

            if (response.token) {
                window.api.setAuthToken(response.token);
                this.isAuthenticated = true;
                this.currentUser = response.user;
                
                window.dispatchEvent(new CustomEvent('auth:login', {
                    detail: { user: this.currentUser }
                }));
                
                return { success: true, user: this.currentUser };
            }

            throw new Error('Login failed');
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(email, password) {
        try {
            // TODO: Replace with real AWS Cognito registration
            const response = await window.api.post('/auth/register', {
                email,
                password
            });

            if (response.success) {
                return { success: true, message: 'Registration successful. Please login.' };
            }

            throw new Error('Registration failed');
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    logout() {
        window.api.clearAuthToken();
        this.isAuthenticated = false;
        this.currentUser = null;
        
        window.dispatchEvent(new CustomEvent('auth:logout'));
        
        // Redirect to home
        window.router.navigate('home');
    }

    async getCurrentUser() {
        if (!this.isAuthenticated) {
            return null;
        }

        try {
            const user = await window.api.getProfile('me');
            this.currentUser = user;
            return user;
        } catch (error) {
            console.error('Error fetching user:', error);
            return null;
        }
    }

    isLoggedIn() {
        return this.isAuthenticated && window.api.getAuthToken() !== null;
    }
}

// Initialize auth service
window.auth = new AuthService();

// Modal handling
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const authBtn = document.getElementById('authBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const showRegisterLink = document.getElementById('showRegister');
    const showLoginLink = document.getElementById('showLogin');

    // Close buttons
    const closeBtns = document.querySelectorAll('.close');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            loginModal.classList.remove('active');
            registerModal.classList.remove('active');
        });
    });

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('active');
        }
        if (e.target === registerModal) {
            registerModal.classList.remove('active');
        }
    });

    // Auth button click
    authBtn.addEventListener('click', () => {
        if (window.auth.isLoggedIn()) {
            window.auth.logout();
        } else {
            loginModal.classList.add('active');
        }
    });

    // Show register modal
    showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginModal.classList.remove('active');
        registerModal.classList.add('active');
    });

    // Show login modal
    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        registerModal.classList.remove('active');
        loginModal.classList.add('active');
    });

    // Login form submit
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await window.auth.login(email, password);
            loginModal.classList.remove('active');
            window.utils.showToast('Вход выполнен успешно', 'success');
        } catch (error) {
            window.utils.showToast(error.message || 'Ошибка входа', 'error');
        }
    });

    // Register form submit
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;
        const passwordConfirm = document.getElementById('regPasswordConfirm').value;

        if (password !== passwordConfirm) {
            window.utils.showToast('Пароли не совпадают', 'error');
            return;
        }

        try {
            await window.auth.register(email, password);
            registerModal.classList.remove('active');
            window.utils.showToast('Регистрация выполнена. Войдите в систему.', 'success');
            loginModal.classList.add('active');
        } catch (error) {
            window.utils.showToast(error.message || 'Ошибка регистрации', 'error');
        }
    });

    // Update auth button based on login state
    window.addEventListener('auth:login', () => {
        authBtn.textContent = 'Выйти';
        authBtn.classList.add('btn-secondary');
        authBtn.classList.remove('btn-primary');
    });

    window.addEventListener('auth:logout', () => {
        authBtn.textContent = 'Войти';
        authBtn.classList.add('btn-primary');
        authBtn.classList.remove('btn-secondary');
    });
});
