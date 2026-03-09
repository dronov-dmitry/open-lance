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
        const navMenu = document.getElementById('navMenu');
        
        if (isLoggedIn()) {
            authBtn.textContent = 'Выйти';
            authBtn.onclick = () => {
                if (confirm('Вы уверены, что хотите выйти?')) {
                    logout();
                }
            };
            // Show all menu items
            navMenu.querySelectorAll('a[data-page]').forEach(link => {
                link.style.display = '';
            });
        } else {
            authBtn.textContent = 'Войти';
            authBtn.onclick = () => openLoginModal();
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

        // Click outside to close (prevent closing if dragging from inside to outside)
        let isMouseDownOnModal = false;

        window.addEventListener('mousedown', (event) => {
            isMouseDownOnModal = event.target.classList.contains('modal');
        });

        window.addEventListener('mouseup', (event) => {
            if (isMouseDownOnModal && event.target.classList.contains('modal')) {
                closeAllModals();
            }
            isMouseDownOnModal = false;
        });

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

        // Cloudflare Turnstile (captcha) — рендер при наличии ключа
        const turnstileContainer = document.getElementById('turnstile-login-container');
        if (turnstileContainer && window.APP_CONFIG && window.APP_CONFIG.turnstileSiteKey) {
            function renderTurnstile() {
                if (typeof window.turnstile !== 'undefined') {
                    turnstileContainer.innerHTML = '';
                    window.turnstileLoginWidgetId = window.turnstile.render(turnstileContainer, {
                        sitekey: window.APP_CONFIG.turnstileSiteKey,
                        theme: 'light'
                    });
                } else {
                    setTimeout(renderTurnstile, 100);
                }
            }
            renderTurnstile();
        } else if (turnstileContainer) {
            turnstileContainer.style.display = 'none';
        }

        // Resend verification email handler
        const resendVerificationContainer = document.getElementById('resendVerificationContainer');
        const resendVerificationBtn = document.getElementById('resendVerificationBtn');
        let currentEmailForResend = '';

        resendVerificationBtn.onclick = async () => {
            if (!currentEmailForResend) {
                window.utils.showToast('Email не указан', 'error');
                return;
            }

            try {
                resendVerificationBtn.disabled = true;
                resendVerificationBtn.textContent = 'Отправка...';

                const response = await window.api.resendVerificationEmail(currentEmailForResend);
                
                // Show success message
                if (response.emailSent) {
                    window.utils.showToast('Письмо для подтверждения email отправлено. Проверьте почту.', 'success');
                } else {
                    window.utils.showToast(response.message || 'Письмо для подтверждения email отправлено. Проверьте почту.', 'success');
                }
                resendVerificationContainer.style.display = 'none';
            } catch (error) {
                console.error('Verification email resend error:', error);
                
                // Понятные сообщения об ошибках для пользователя
                let userMessage = 'Ошибка при генерации ссылки для подтверждения';
                
                if (error.message) {
                    if (error.message.includes('Email уже подтвержден')) {
                        userMessage = 'Этот email уже подтвержден. Вы можете войти в систему.';
                    } else if (error.message.includes('Invalid email') || error.message.includes('Неверный формат')) {
                        userMessage = 'Неверный формат email адреса.';
                    } else if (error.message.includes('timeout') || error.message.includes('превысил время ожидания')) {
                        userMessage = 'Сервер не отвечает. Проверьте подключение к интернету и попробуйте позже.';
                    } else if (error.message.includes('Unauthorized') || error.message.includes('401')) {
                        userMessage = 'Ошибка доступа. Попробуйте обновить страницу и повторить попытку.';
                    } else if (error.message.includes('500') || error.message.includes('Internal Server Error') || error.message.includes('Failed to send') || error.message.includes('Email service')) {
                        userMessage = 'Ошибка отправки письма. Проверьте настройки EmailJS или обратитесь в поддержку.';
                    } else if (error.message.includes('Не удалось') || error.message.includes('недоступен')) {
                        userMessage = 'Сервис временно недоступен. Попробуйте позже.';
                    } else if (error.message.includes('базы данных') || error.message.includes('database')) {
                        userMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
                    } else if (error.message.includes('сети') || error.message.includes('network')) {
                        userMessage = 'Ошибка сети. Проверьте подключение к интернету.';
                    } else {
                        userMessage = error.message;
                    }
                }
                
                window.utils.showToast(userMessage, 'error', 10000);
            } finally {
                resendVerificationBtn.disabled = false;
                resendVerificationBtn.textContent = 'Получить ссылку повторно';
            }
        };

        // Resend verification email handler logic inside register
        const resendVerificationRegisterContainer = document.getElementById('resendVerificationRegisterContainer');
        const resendVerificationRegisterBtn = document.getElementById('resendVerificationRegisterBtn');

        if (resendVerificationRegisterBtn) {
            resendVerificationRegisterBtn.onclick = async () => {
                const email = document.getElementById('regEmail').value;
                if (!email) return;

                try {
                    resendVerificationRegisterBtn.disabled = true;
                    resendVerificationRegisterBtn.textContent = 'Отправка...';

                    const response = await window.api.resendVerificationEmail(email);
                    
                    if (response.emailSent) {
                        window.utils.showToast('Письмо для подтверждения email отправлено. Проверьте почту.', 'success');
                    } else {
                        window.utils.showToast(response.message || 'Письмо для подтверждения email отправлено. Проверьте почту.', 'success');
                    }
                    resendVerificationRegisterContainer.style.display = 'none';
                    setTimeout(() => openLoginModal(), 1000);
                } catch (error) {
                    console.error('Verification email resend error (register):', error);
                    let userMessage = 'Ошибка при генерации ссылки для подтверждения';
                    
                    if (error.message) {
                        if (error.message.includes('Email уже подтвержден')) {
                            userMessage = 'Этот email уже подтвержден. Вы можете войти в систему.';
                            setTimeout(() => openLoginModal(), 1000);
                        } else if (error.message.includes('500') || error.message.includes('Failed to send') || error.message.includes('EmailJS')) {
                            userMessage = 'Ошибка отправки письма. Проверьте настройки EmailJS или обратитесь в поддержку.';
                        } else {
                            userMessage = error.message;
                        }
                    }
                    window.utils.showToast(userMessage, 'error', 10000);
                } finally {
                    resendVerificationRegisterBtn.disabled = false;
                    resendVerificationRegisterBtn.textContent = 'Отправить письмо повторно';
                }
            };
        }

        // Login form submit
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const turnstileToken = window.APP_CONFIG && window.APP_CONFIG.turnstileSiteKey && typeof window.turnstile !== 'undefined' && window.turnstileLoginWidgetId != null
                ? window.turnstile.getResponse(window.turnstileLoginWidgetId)
                : '';
            if (window.APP_CONFIG && window.APP_CONFIG.turnstileSiteKey && !turnstileToken) {
                window.utils.showToast('Пожалуйста, пройдите проверку (капча)', 'warning');
                return;
            }

            // Hide resend container on new login attempt
            resendVerificationContainer.style.display = 'none';
            currentEmailForResend = '';

            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Входим...';

                const response = await window.api.login(email, password, turnstileToken);
                
                if (response.token) {
                    login(response.token, response.user);
                    closeAllModals();
                    loginForm.reset();
                    if (window.turnstileLoginWidgetId != null && typeof window.turnstile !== 'undefined') {
                        window.turnstile.reset(window.turnstileLoginWidgetId);
                    }
                    window.utils.showToast('Вы успешно вошли в систему!', 'success');
                    window.router.navigate('tasks');
                } else {
                    throw new Error('Не получен токен авторизации');
                }
            } catch (error) {
                console.error('Login error:', error);
                if (window.turnstileLoginWidgetId != null && typeof window.turnstile !== 'undefined') {
                    window.turnstile.reset(window.turnstileLoginWidgetId);
                }
                const errorMessage = error.message || 'Ошибка входа. Проверьте данные.';
                
                // Check if error is about unverified email
                if (errorMessage.includes('Подтвердите Email') || errorMessage.includes('не подтвержден')) {
                    currentEmailForResend = email;
                    resendVerificationContainer.style.display = 'block';
                }
                
                window.utils.showToast(errorMessage, 'error');
            } finally {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Войти';
            }
        };

        // Register form submit
        registerForm.onsubmit = async (e) => {
            e.preventDefault(); // Moved to the very top to stop page refresh on any error!
            
            if (resendVerificationRegisterContainer) {
                resendVerificationRegisterContainer.style.display = 'none';
            }

            const startTime = new Date().toISOString();
            console.log(`[${startTime}] [Register Form] Submit event triggered`);
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
                
                // The new backend no longer auto-logs in and returns a token immediately.
                // It requires email verification.
                closeAllModals();
                registerForm.reset();
                window.utils.showToast('Регистрация успешна! Письмо для подтверждения email отправлено на вашу почту. Проверьте почту и перейдите по ссылке для подтверждения.', 'success');
                // Open login modal so they are ready once they click the link
                setTimeout(() => openLoginModal(), 1000);
            } catch (error) {
                const timestamp = new Date().toISOString();
                console.error(`[${timestamp}] [Register Form] Error caught:`, error);
                
                const errorMessage = error.message || 'Ошибка регистрации. Попробуйте другой email.';
                
                if (errorMessage.includes('уже существует')) {
                    if (resendVerificationRegisterContainer) {
                        resendVerificationRegisterContainer.style.Display = 'block'; // Fallback uppercase D to match old logic style... wait, no, .style.display
                        resendVerificationRegisterContainer.style.display = 'block';
                    } else {
                        // Fallback completely
                        const shouldResend = confirm(
                            'Пользователь с таким email уже существует. Возможно, email не был подтвержден.\n\n' +
                            'Отправить письмо для подтверждения email повторно?'
                        );
                        if (shouldResend) {
                            try {
                                await window.api.resendVerificationEmail(email);
                                window.utils.showToast('Письмо для подтверждения email отправлено. Проверьте почту.', 'success');
                                setTimeout(() => openLoginModal(), 1000);
                            } catch (resendError) {
                                window.utils.showToast(resendError.message || 'Ошибка при отправке письма', 'error');
                            }
                        }
                    }
                } else {
                    if (window.utils && typeof window.utils.showToast === 'function') {
                        window.utils.showToast(errorMessage, 'error');
                    } else {
                        alert(errorMessage); // Fallback
                    }
                }
            } finally {
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
        getToken,
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
