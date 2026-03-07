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
        
        // Title based on type
        const titles = {
            error: '❌ Ошибка',
            success: '✅ Успешно',
            warning: '⚠️ Внимание',
            info: 'ℹ️ Информация'
        };
        
        toast.innerHTML = `
            <strong>${titles[type] || 'Информация'}</strong>
            <p>${message}</p>
        `;
        
        // Set styles
        const toastId = Date.now() + Math.random();
        toast.setAttribute('data-toast-id', toastId);
        toast.style.cssText = 'opacity: 1; cursor: pointer; transition: opacity 0.3s ease;';
        toast.className = `toast ${type}`;
        
        container.appendChild(toast);
        console.log(`[${timestamp}] [showToast] Toast #${toastId} added to DOM`);
        
        // Force reflow
        void toast.offsetHeight;
        
        // Auto remove after 10 seconds
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
        
        const timeoutId = setTimeout(removeToast, 10000);
        
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
    }
};
// Register "My Tasks" route
window.router.register('my-tasks', async function() {
    if (!window.auth.isLoggedIn()) {
        return `
            <div class="empty-state">
                <h3>Необходима авторизация</h3>
                <p>Войдите в систему, чтобы просмотреть свои задачи</p>
                <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-primary">
                    Войти
                </button>
            </div>
        `;
    }
    try {
        // Optimistic loading: показываем кэш сразу, если есть
        const cached = localStorage.getItem('my-tasks-cache');
        const cacheTime = localStorage.getItem('my-tasks-cache-time');
        const CACHE_TTL = 5 * 60 * 1000; // 5 минут
        
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
                    <p style="margin-top: 1rem; color: #7f8c8d;">Загрузка ваших задач...</p>
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
                <h1 style="margin-bottom: 2rem;">Мои задачи</h1>
                <div class="card" style="margin-bottom: 2rem;">
                    <h2 style="margin-bottom: 1rem;">Мои задания (как заказчик)</h2>
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
                                            Подробнее
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d;">У вас пока нет созданных задач</p>
                    `}
                </div>
                <div class="card">
                    <h2 style="margin-bottom: 1rem;">Мои отклики (как исполнитель)</h2>
                    ${myApplications && myApplications.length > 0 ? `
                        <div class="grid grid-2">
                            ${myApplications.map(app => `
                                <div class="task-card">
                                    <h3 class="card-title">${app.task_title}</h3>
                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        Откликнулись: ${window.utils.formatDate(app.applied_at)}
                                    </p>
                                    <p style="margin-bottom: 1rem;">
                                        <strong>Ваше сообщение:</strong><br>
                                        ${app.message}
                                    </p>
                                    <div class="task-footer">
                                        <span class="task-status status-${app.status.toLowerCase()}">${getTaskStatusText(app.status)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d;">Вы пока не откликались на задачи</p>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading my tasks:', error);
        return `
            <div class="empty-state">
                <h3>Ошибка загрузки</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
});
function getTaskStatusText(status) {
    const statusMap = {
        'OPEN': 'Открыта',
        'MATCHED': 'В работе',
        'COMPLETED': 'Завершена',
        'CANCELLED': 'Отменена'
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
    
    // Check API availability
    if (window.api && typeof window.api.checkHealth === 'function') {
        try {
            const healthCheck = await window.api.checkHealth();
            if (!healthCheck.available) {
                console.error('[App] API недоступен:', healthCheck.error);
                console.error('[App] API URL:', window.APP_CONFIG?.apiBaseURL);
                // Show warning but don't block the app
                if (window.utils && typeof window.utils.showToast === 'function') {
                    window.utils.showToast(
                        `⚠️ API недоступен: ${healthCheck.error}. Проверьте настройки backend.`,
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

            window.utils.showToast('Email успешно подтвержден! Теперь вы можете войти.', 'success');
            setTimeout(() => {
                if (window.auth) window.auth.openLoginModal();
            }, 1000);
        } catch (e) {
            window.utils.showToast(e.message || 'Ошибка подтверждения Email. Возможно, ссылка устарела.', 'error');
        }
    }

    // Initialize router on page load
    // Check if there's a hash, if not, navigate to home
    if (!window.location.hash || window.location.hash === '#') {
        window.router.navigate('home', {}, { replace: true });
    } else {
        window.dispatchEvent(new Event('popstate'));
    }
});
// Handle global errors
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    window.utils.showToast('Произошла ошибка. Попробуйте обновить страницу.', 'error');
});
// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    window.utils.showToast('Произошла ошибка при выполнении запроса.', 'error');
});
