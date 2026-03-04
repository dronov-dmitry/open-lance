// Main application initialization

// Utility functions
window.utils = {
    // Show toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <strong>${type === 'error' ? 'Ошибка' : type === 'success' ? 'Успешно' : 'Информация'}</strong>
            <p style="margin: 0.5rem 0 0 0;">${message}</p>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
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
        // Get user's tasks (as client) and applications (as worker)
        const [myTasks, myApplications] = await Promise.all([
            window.api.getTasks({ owner: 'me' }),
            window.api.getMyApplications()
        ]);

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
    // TODO: Implement task details page
    window.utils.showToast('Просмотр деталей задачи: ' + taskId, 'info');
};

// App initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Open-Lance application initialized');
    console.log('Environment:', window.APP_CONFIG);
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
