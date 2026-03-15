// Main application initialization
// Utility functions
window.utils = {
    // Show toast notification
    showToast(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [showToast] Called with:`, { message, type });
        
        const container = document.getElementById('toastContainer');
        if (!container) {
            console.error(`[${timestamp}] [showToast] ERROR: Toast container not found!`);
            return;
        }
        
        console.log(`[${timestamp}] [showToast] Container found, existing toasts:`, container.querySelectorAll('.toast').length);
        
        // Limit to max 3 toasts at once
        const existingToasts = container.querySelectorAll('.toast');
        if (existingToasts.length >= 3) {
            existingToasts[0].remove();
        }
        
        const toast = document.createElement('div');
        
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        const titles = {
            error: '❌ ' + t('toast.error'),
            success: '✅ ' + t('toast.success'),
            warning: '⚠️ ' + t('toast.warning'),
            info: 'ℹ️ ' + t('toast.info')
        };
        toast.innerHTML = `
            <strong>${titles[type] || t('toast.info')}</strong>
            <p>${message}</p>
        `;
        
        // Set styles
        const toastId = Date.now() + Math.random();
        toast.setAttribute('data-toast-id', toastId);
        toast.style.cssText = 'opacity: 1; cursor: pointer; transition: opacity 0.3s ease;';
        toast.className = `toast ${type}`;
        
        container.appendChild(toast);
        console.log(`[${timestamp}] [showToast] Toast #${toastId} added to DOM`);
        
        // Force reflow to ensure styles are applied
        void toast.offsetHeight;
        
        // Ensure toast is visible
        toast.style.display = 'block';
        toast.style.opacity = '1';
        toast.style.visibility = 'visible';
        
        // Auto remove after 5 seconds
        const toastElement = toast;
        const removeToast = () => {
            const removeTime = new Date().toISOString();
            console.log(`[${removeTime}] [showToast] Removing toast #${toastId}`);
            if (toastElement && toastElement.parentNode) {
                toastElement.style.opacity = '0';
                setTimeout(() => {
                    if (toastElement.parentNode) {
                        toastElement.remove();
                        console.log(`[${removeTime}] [showToast] Toast #${toastId} removed from DOM`);
                    }
                }, 300);
            }
        };
        
        const timeoutId = setTimeout(removeToast, 2000);
        
        // Click to dismiss
        toastElement.addEventListener('click', () => {
            console.log(`[${new Date().toISOString()}] [showToast] Toast #${toastId} clicked, dismissing`);
            clearTimeout(timeoutId);
            removeToast();
        });
        
        console.log(`[${timestamp}] [showToast] Toast #${toastId} setup complete`);
    },
    // Format currency
    formatCurrency(amount) {
        if (window.currencyService) {
            return window.currencyService.formatAmount(amount);
        }
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB'
        }).format(amount);
    },
    // Format date
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },
    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    // Единый блок «Необходима авторизация» (DRY)
    renderAuthRequired(message) {
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        return `
            <div class="empty-state">
                <h3>${t('common.authRequired')}</h3>
                <p>${message}</p>
                <br>
                <button onclick="window.auth.openLoginModal()" class="btn btn-primary">
                    ${t('nav.login')}
                </button>
            </div>
        `;
    }
};

// Обновить значок непрочитанных сообщений в навбаре (вызывается при логине и при загрузке сообщений)
window.updateUnreadMessagesBadge = async function(optionalCount) {
    const link = document.querySelector('a[data-page="messages"]');
    if (!link) return;
    let count;
    if (typeof optionalCount === 'number') {
        count = optionalCount;
    } else if (!window.auth.isLoggedIn()) {
        count = 0;
    } else if (window.api && typeof window.api.getUnreadMessagesCount === 'function') {
        try {
            count = await window.api.getUnreadMessagesCount();
        } catch (e) {
            count = 0;
        }
    } else {
        count = 0;
    }
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const badge = count > 0
        ? ' <span class="nav-unread-badge" title="' + t('common.unreadBadge') + '">' + (count > 99 ? '99+' : count) + '</span>'
        : '';
    link.innerHTML = t('nav.messages') + badge;
};

// Register "My Tasks" route
window.router.register('my-tasks', async function() {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!window.auth.isLoggedIn()) {
        return window.utils.renderAuthRequired(t('myTasks.authRequired'));
    }
    try {
        // Optimistic loading: показываем кэш сразу, если есть
        const cached = localStorage.getItem('my-tasks-cache');
        const cacheTime = localStorage.getItem('my-tasks-cache-time');
        // Disable optimization caching to ensure reliable display of new applications
        const CACHE_TTL = 0; // 0 минут, всегда загружать свежие данные
        
        let myTasks = [];
        let myApplications = [];
        let fromCache = false;
        
        // Если кэш свежий, используем его
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
            const cachedData = JSON.parse(cached);
            myTasks = cachedData.myTasks || [];
            myApplications = cachedData.myApplications || [];
            fromCache = true;
            console.log('[MyTasks] Using cached data, age:', Math.round((Date.now() - parseInt(cacheTime)) / 1000), 'seconds');
        }
        
        // Загружаем свежие данные (в фоне если есть кэш)
        const fetchData = async () => {
            const [tasksResponse, appsResponse] = await Promise.all([
                window.api.getTasks({ owner: 'me' }),
                window.api.getMyApplications()
            ]);
            
            // Extract the actual data arrays from the API responses
            const freshTasks = tasksResponse.data || [];
            const freshApps = appsResponse.data?.applications || [];
            
            // Сохраняем в кэш
            const dataToCache = {
                myTasks: freshTasks,
                myApplications: freshApps
            };
            localStorage.setItem('my-tasks-cache', JSON.stringify(dataToCache));
            localStorage.setItem('my-tasks-cache-time', Date.now().toString());
            
            console.log('[MyTasks] Fresh data loaded and cached');
            
            return [freshTasks, freshApps];
        };
        
        // Если нет кэша, показываем loader и ждем загрузки
        if (!fromCache) {
            // Показываем loading indicator
            document.getElementById('app').innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: #7f8c8d;">${t('myTasks.loadMy')}</p>
                </div>
            `;
            
            const [freshTasks, freshApps] = await fetchData();
            myTasks = freshTasks;
            myApplications = freshApps;
        } else {
            // Если есть кэш, загружаем в фоне и обновляем позже
            fetchData().then(([freshTasks, freshApps]) => {
                // Если данные изменились, тихо обновляем страницу
                const currentData = JSON.stringify({ myTasks, myApplications });
                const freshData = JSON.stringify({ myTasks: freshTasks, myApplications: freshApps });
                if (currentData !== freshData) {
                    console.log('[MyTasks] Data changed, silent reload');
                    window.router.navigate('my-tasks', { replace: true });
                }
            }).catch(err => {
                console.error('[MyTasks] Background refresh failed:', err);
            });
        }
        
        return `
            <div class="my-tasks-page">
                <h1 style="margin-bottom: 2rem;">${t('myTasks.title')}</h1>
                <div class="card" style="margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 1rem;">${t('myTasks.asCustomer')}</h2>
                    ${myTasks && myTasks.length > 0 ? `
                        <div class="grid grid-2">
                            ${myTasks.map(task => `
                                <div class="task-card">
                                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                        <h3 class="card-title" style="margin: 0;">${task.title}</h3>
                                        <span class="task-status status-${task.status.toLowerCase()}">${getTaskStatusText(task.status)}</span>
                                    </div>
                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        ${task.description.substring(0, 100)}...
                                    </p>
                                    <div class="task-footer">
                                        <span>${window.utils.formatDate(task.created_at)}</span>
                                        <button onclick="viewTaskDetails('${task.task_id}')" class="btn btn-secondary">
                                            ${t('common.more')}
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d;">${t('myTasks.noCreated')}</p>
                    `}
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 1rem;">${t('myTasks.asWorker')}</h2>
                    ${myApplications && myApplications.length > 0 ? `
                        <div class="grid grid-2">
                            ${myApplications.map(app => {
                                // If task is MATCHED and this worker is the matched user, application should be ACCEPTED
                                let appStatus = app.status;
                                if (app.task && app.task.status === 'MATCHED' && app.task.matched_user_id === app.worker_id) {
                                    appStatus = 'ACCEPTED';
                                }
                                return `
                                <div class="task-card">
                                    <h3 class="card-title">${app.task_title || (app.task ? app.task.title : t('myTasks.task'))}</h3>
                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        ${t('myTasks.responded')} ${window.utils.formatDate(app.created_at || app.updated_at)}
                                    </p>
                                    <p style="margin-bottom: 1rem;">
                                        <strong>${t('myTasks.yourMessage')}</strong><br>
                                        ${app.message}
                                    </p>
                                    <div class="task-footer" style="display: flex; justify-content: space-between; align-items: center;">
                                        <span class="task-status status-${appStatus.toLowerCase()}">${getTaskStatusText(appStatus)}</span>
                                        ${app.task_id ? `<button onclick="viewTaskDetails('${app.task_id}')" class="btn btn-secondary">${t('common.more')}</button>` : ''}
                                    </div>
                                </div>
                            `;
                            }).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d;">${t('myTasks.noApplications')}</p>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading my tasks:', error);
        return `
            <div class="empty-state">
                <h3>${t('myTasks.loadError')}</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});
function getTaskStatusText(status) {
    const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const statusMap = {
        'OPEN': t('status.OPEN'), 'MATCHED': t('status.MATCHED'), 'COMPLETED': t('status.COMPLETED'), 'CANCELLED': t('status.CANCELLED'),
        'PENDING': t('status.PENDING'), 'ACCEPTED': t('status.ACCEPTED'), 'REJECTED': t('status.REJECTED')
    };
    return statusMap[status] || status;
}
window.viewTaskDetails = function(taskId) {
    window.router.navigate('task-details', { id: taskId });
};
// App initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Open-Lance application initialized');
    console.log('Environment:', window.APP_CONFIG);

    // Initialize currency service
    if (window.currencyService) {
        await window.currencyService.init();
    }
    
    // Check API availability
    if (window.api && typeof window.api.checkHealth === 'function') {
        try {
            const healthCheck = await window.api.checkHealth();
                if (!healthCheck.available) {
                console.error('[App] API недоступен:', healthCheck.error);
                console.error('[App] API URL:', window.APP_CONFIG?.apiBaseURL);
                const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
                if (window.utils && typeof window.utils.showToast === 'function') {
                    window.utils.showToast(
                        '⚠️ ' + t('app.apiUnavailable') + ': ' + healthCheck.error + '. ' + t('app.refreshPage'),
                        'error',
                        10000
                    );
                }
            } else {
                console.log('[App] API health check passed:', healthCheck.data);
            }
        } catch (error) {
            console.error('[App] Health check failed:', error);
        }
    }
    
    // Check for email verification token
    const hashParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const verifyToken = hashParams.get('verify') || new URLSearchParams(window.location.search).get('verify');
    
    if (verifyToken) {
        try {
            await window.api.request(`/auth/verify?token=${verifyToken}`, { method: 'GET' });
            
            // Remove token from URL
            const url = new URL(window.location);
            url.searchParams.delete('verify');
            
            // Check hash as well
            if (window.location.hash.includes('verify=')) {
                let newHash = window.location.hash.replace(/([?&])verify=[^&]+(&|$)/, '$1');
                if (newHash.endsWith('?') || newHash.endsWith('&')) {
                    newHash = newHash.slice(0, -1);
                }
                window.location.hash = newHash;
            } else {
                window.history.replaceState({}, document.title, url.pathname + url.search);
            }

            window.utils.showToast((window.i18n && window.i18n.t ? window.i18n.t('auth.verifySuccess') : 'Email успешно подтвержден! Теперь вы можете войти.'), 'success');
            setTimeout(() => {
                if (window.auth) window.auth.openLoginModal();
            }, 1000);
        } catch (e) {
            window.utils.showToast(e.message || (window.i18n && window.i18n.t ? window.i18n.t('auth.verifyError') : 'Ошибка подтверждения Email.'), 'error');
        }
    }

    // Initialize router on page load
    // Check if there's a hash, if not, navigate to home
    if (!window.location.hash || window.location.hash === '#') {
        window.router.navigate('home', {}, { replace: true });
    } else {
        window.dispatchEvent(new Event('popstate'));
    }

    // Delegated click: "Подробнее" / profile link (works for dynamically inserted buttons)
    document.addEventListener('click', function(e) {
        const el = e.target.closest('[data-profile-id]');
        if (el) {
            e.preventDefault();
            const id = el.getAttribute('data-profile-id');
            if (id && window.router && typeof window.router.navigate === 'function') {
                window.router.navigate('profile', { id });
            }
        }
    });

    // Mobile nav: toggle menu on hamburger click, close when link clicked or outside
    var navToggle = document.getElementById('navToggle');
    var navbar = document.querySelector('.navbar');
    var navMenu = document.getElementById('navMenu');
    if (navToggle && navbar && navMenu) {
        navToggle.addEventListener('click', function() {
            navbar.classList.toggle('nav-open');
            navToggle.classList.toggle('is-active');
            document.body.style.overflow = navbar.classList.contains('nav-open') ? 'hidden' : '';
        });
        navMenu.addEventListener('click', function(e) {
            if (e.target.closest('a') || e.target.closest('button')) {
                navbar.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('click', function(e) {
            if (navbar.classList.contains('nav-open') && !navbar.contains(e.target)) {
                navbar.classList.remove('nav-open');
                navToggle.classList.remove('is-active');
                document.body.style.overflow = '';
            }
        });
    }

    if (window.auth.isLoggedIn() && typeof window.updateUnreadMessagesBadge === 'function') {
        window.updateUnreadMessagesBadge();
    }

    if (window.i18n) {
        window.i18n.applyToPage();
        const langBtn = document.getElementById('langBtn');
        const langDropdown = document.getElementById('langDropdown');
        if (langBtn && langDropdown) {
            langBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                langDropdown.classList.toggle('show');
            });
            langDropdown.querySelectorAll('button[data-lang]').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.i18n.setLang(btn.getAttribute('data-lang'));
                    langDropdown.classList.remove('show');
                });
            });
            document.addEventListener('click', () => langDropdown.classList.remove('show'));
        }
    }
});
// Handle global errors (skip Turnstile widget errors to show a specific message)
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error, event.message);
    const msg = (event.error && event.error.message) ? String(event.error.message) : (event.message || '');
    const isTurnstile = (event.error && (event.error.name === 'TurnstileError' || String(event.error.message || '').includes('Turnstile') || String(event.error.message || '').includes('400020'))) ||
        (msg.includes('Turnstile') || msg.includes('400020'));
    if (isTurnstile) {
        var host = window.location.hostname || 'localhost';
        const t = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        window.utils.showToast(t('app.turnstileDomain') + host + t('app.turnstileAdd'), 'error', 10000);
        event.preventDefault();
        return true;
    }
    window.utils.showToast(window.i18n && window.i18n.t ? window.i18n.t('app.genericError') : 'Произошла ошибка. Попробуйте обновить страницу.', 'error');
});
// Handle unhandled promise rejections (skip Turnstile)
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    const isTurnstile = event.reason && (
        (event.reason.name === 'TurnstileError') ||
        (event.reason.message && String(event.reason.message).includes('Turnstile')) ||
        (event.reason.message && String(event.reason.message).includes('400020'))
    );
    if (isTurnstile) {
        window.utils.showToast(window.i18n && window.i18n.t ? window.i18n.t('app.turnstileUnavailable') : 'Капча Turnstile недоступна.', 'error', 8000);
        event.preventDefault();
        return;
    }
    window.utils.showToast(window.i18n && window.i18n.t ? window.i18n.t('app.requestError') : 'Произошла ошибка при выполнении запроса.', 'error');
});
