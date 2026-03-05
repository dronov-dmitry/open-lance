// Auth module - handles authentication and modals
window.auth = (function() {
    // Get token from localStorage
    function getToken() {
        return localStorage.getItem('authToken');
    }

    // Save token to localStorage
    function saveToken(token) {
        localStorage.setItem('authToken', token);
        window.authToken = token;
    }

    // Remove token from localStorage
    function removeToken() {
        localStorage.removeItem('authToken');
        window.authToken = null;
    }

    function isLoggedIn() {
        return !!getToken();
    }

    function login(token, userData) {
        saveToken(token);
        if (userData) {
            localStorage.setItem('userData', JSON.stringify(userData));
            window.currentUser = userData;
        }
        updateUI();
        window.dispatchEvent(new CustomEvent('auth:login'));
    }

    function logout() {
        removeToken();
        localStorage.removeItem('userData');
        window.currentUser = null;
        updateUI();
        window.router.navigate('home');
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    function getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    function updateUI() {
        const authBtn = document.getElementById('authBtn');
        const createTaskBtn = document.getElementById('createTaskBtn');
        const navMenu = document.getElementById('navMenu');
        
        if (isLoggedIn()) {
            authBtn.textContent = 'Выйти';
            authBtn.onclick = () => {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    logout();
                }
            };
            // Show create task button
            if (createTaskBtn) {
                createTaskBtn.style.display = 'inline-block';
            }
            // Show all menu items
            navMenu.querySelectorAll('a[data-page]').forEach(link => {
                link.style.display = '';
            });
        } else {
            authBtn.textContent = 'Войти';
            authBtn.onclick = () => openLoginModal();
            // Hide create task button
            if (createTaskBtn) {
                createTaskBtn.style.display = 'none';
            }
            // Hide protected pages
            const protectedPages = ['my-tasks', 'profile'];
            navMenu.querySelectorAll('a[data-page]').forEach(link => {
                if (protectedPages.includes(link.dataset.page)) {
                    link.style.display = 'none';
                }
            });
        }
    }

    // Initialize auth on page load
    function init() {
        // Restore token if exists
        const token = getToken();
        if (token) {
            window.authToken = token;
            const userData = getCurrentUser();
            if (userData) {
                window.currentUser = userData;
            }
        }
        
        updateUI();
        setupModals();
    }

    // Setup modal functionality
    function setupModals() {
        const loginModal = document.getElementById('loginModal');
        const registerModal = document.getElementById('registerModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');

        // Close buttons
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.onclick = () => {
                closeAllModals();
            };
        });

        // Click outside to close
        window.onclick = (event) => {
            if (event.target.classList.contains('modal')) {
                closeAllModals();
            }
        };

        // Show register from login
        document.getElementById('showRegister').onclick = (e) => {
            e.preventDefault();
            loginModal.classList.remove('active');
            registerModal.classList.add('active');
        };

        // Show login from register
        document.getElementById('showLogin').onclick = (e) => {
            e.preventDefault();
            registerModal.classList.remove('active');
            loginModal.classList.add('active');
        };

        // Login form submit
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Входим...';

                const response = await window.api.login(email, password);
                
                if (response.token) {
                    login(response.token, response.user);
                    closeAllModals();
                    loginForm.reset();
                    window.utils.showToast('Вы успешно вошли в систему!', 'success');
                    window.router.navigate('tasks');
                } else {
                    throw new Error('Не получен токен авторизации');
                }
            } catch (error) {
                console.error('Login error:', error);
                window.utils.showToast(error.message || 'Ошибка входа. Проверьте данные.', 'error');
            } finally {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Войти';
            }
        };

        // Register form submit
        registerForm.onsubmit = async (e) => {
            const startTime = new Date().toISOString();
            console.log(`[${startTime}] [Register Form] Submit event triggered`);
            e.preventDefault();
            console.log(`[${startTime}] [Register Form] Default prevented`);
            
            const email = document.getElementById('regEmail').value;
            const password = document.getElementById('regPassword').value;
            const passwordConfirm = document.getElementById('regPasswordConfirm').value;
            
            console.log(`[${startTime}] [Register Form] Form data:`, { email, passwordLength: password.length });

            if (password !== passwordConfirm) {
                console.log(`[${startTime}] [Register Form] Password mismatch`);
                window.utils.showToast('Пароли не совпадают', 'error');
                return;
            }

            if (password.length < 6) {
                console.log(`[${startTime}] [Register Form] Password too short`);
                window.utils.showToast('Пароль должен быть не менее 6 символов', 'error');
                return;
            }

            const submitBtn = registerForm.querySelector('button[type="submit"]');
            console.log(`[${startTime}] [Register Form] Submit button state:`, { disabled: submitBtn.disabled });
            
            try {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Регистрируем...';
                const apiCallTime = new Date().toISOString();
                console.log(`[${apiCallTime}] [Register Form] Calling API register...`);

                const response = await window.api.register(email, password);
                console.log('[Register Form] API response received:', response);
                
                if (response.token) {
                    console.log('[Register Form] Token received, logging in...');
                    login(response.token, response.user);
                    closeAllModals();
                    registerForm.reset();
                    window.utils.showToast('Регистрация успешна! Добро пожаловать!', 'success');
                    window.router.navigate('profile');
                } else {
                    throw new Error('Не получен токен авторизации');
                }
            } catch (error) {
                const timestamp = new Date().toISOString();
                console.error(`[${timestamp}] [Register Form] Error caught:`, error);
                console.log(`[${timestamp}] [Register Form] Calling showToast with:`, error.message);
                
                // Correct location: window.utils.showToast
                if (window.utils && typeof window.utils.showToast === 'function') {
                    window.utils.showToast(error.message || 'Ошибка регистрации. Попробуйте другой email.', 'error');
                    console.log(`[${timestamp}] [Register Form] showToast called successfully`);
                } else {
                    console.error(`[${timestamp}] [Register Form] ERROR: window.utils.showToast NOT FOUND!`);
                    alert(error.message); // Fallback
                }
            } finally {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] [Register Form] Finally block - re-enabling button`);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Зарегистрироваться';
            }
        };
    }

    function openLoginModal() {
        document.getElementById('loginModal').classList.add('active');
    }

    function openRegisterModal() {
        document.getElementById('registerModal').classList.add('active');
    }

    function closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    return { 
        isLoggedIn, 
        login, 
        logout, 
        getCurrentUser,
        updateUI,
        init,
        openLoginModal,
        openRegisterModal
    };
})();

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.auth.init());
} else {
    window.auth.init();
}
