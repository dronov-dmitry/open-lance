// Tasks component
window.router.register('tasks', async function() {
    try {
        // Optimistic loading pattern (similar to my-tasks)
        const cached = localStorage.getItem('all-tasks-cache');
        const cacheTime = localStorage.getItem('all-tasks-cache-time');
        const CACHE_TTL = 1 * 60 * 1000; // 1 minute
        
        let allTasks = [];
        let fromCache = false;
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
            allTasks = JSON.parse(cached);
            fromCache = true;
        }
        
        const fetchData = async () => {
            // Fetch all tasks where status is OPEN
            const response = await window.api.getTasks({ status: 'OPEN' });
            const freshTasks = response.data || [];
            localStorage.setItem('all-tasks-cache', JSON.stringify(freshTasks));
            localStorage.setItem('all-tasks-cache-time', Date.now().toString());
            return freshTasks;
        };
        
        if (!fromCache) {
            document.getElementById('app').innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <div style="display: inline-block; width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                    <p style="margin-top: 1rem; color: #7f8c8d;">Загрузка списка задач...</p>
                </div>
            `;
            allTasks = await fetchData();
        } else {
            fetchData().then(freshTasks => {
                if (JSON.stringify(allTasks) !== JSON.stringify(freshTasks)) {
                    window.router.navigate('tasks', { replace: true });
                }
            }).catch(e => console.error('Background tasks refresh failed:', e));
        }

        // Parse JWT to check for ADMIN role
        let isAdmin = false;
        let currentUserId = null;
        if (window.auth.isLoggedIn() && window.auth.getToken()) {
            try {
                const token = window.auth.getToken();
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
                const decoded = JSON.parse(jsonPayload);
                isAdmin = decoded.role === 'ADMIN';
                currentUserId = decoded.userId;
            } catch(e) {}
        }

        window.deleteTaskAdmin = async (taskId) => {
            if (!confirm('Вы уверены, что хотите УДАЛИТЬ эту задачу?')) return;
            try {
                await window.api.request(`/tasks/${taskId}`, { method: 'DELETE' });
                window.utils.showToast('Задача удалена', 'success');
                // Force cache invalidation and reload
                localStorage.removeItem('all-tasks-cache');
                localStorage.removeItem('all-tasks-cache-time');
                window.router.navigate('tasks', { replace: true });
            } catch (e) {
                window.utils.showToast(e.message || 'Ошибка удаления', 'error');
            }
        };

        const getInitials = (name, email) => {
            if (name) {
                const parts = name.trim().split(/\s+/);
                if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
                else if (parts[0] && parts[0].length > 0) return parts[0][0].toUpperCase();
            }
            if (email && email.length > 0) return email[0].toUpperCase();
            return '?';
        };

        return `
            <div class="tasks-page">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h1 style="margin: 0;">Все открытые задачи</h1>
                    ${window.auth.isLoggedIn() ? `
                        <button class="btn btn-primary" onclick="document.getElementById('createTaskModal').classList.add('active')">
                            Создать задачу
                        </button>
                    ` : ''}
                </div>
                
                <div class="card">
                    ${allTasks && allTasks.length > 0 ? `
                        <div class="grid grid-2">
                            ${allTasks.map(task => `
                                <div class="task-card">
                                    <h3 class="card-title" style="margin-bottom: 10px;">${task.title}</h3>
                                    
                                    ${task.author ? `
                                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding: 6px; background: #f8f9fa; border-radius: 6px;">
                                            ${task.author.avatar_url 
                                                ? `<img src="${task.author.avatar_url}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">`
                                                : `<div style="width: 24px; height: 24px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; letter-spacing: 0.5px;">${getInitials(task.author.name, task.author.email)}</div>`
                                            }
                                            <a href="#" onclick="window.router.navigate('profile', { id: '${task.owner_id}' }); return false;" style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color); text-decoration: none;">${task.author.name || task.author.email || 'Без имени'}</a>
                                        </div>
                                    ` : ''}

                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        ${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}
                                    </p>
                                    <div style="margin-bottom: 1rem;">
                                        <strong>Бюджет:</strong> ${window.utils.formatCurrency(task.budget_estimate)}
                                        <br>
                                        <strong>Срок:</strong> ${window.utils.formatDate(task.deadline)}
                                    </div>
                                    <div class="task-footer">
                                        <span style="font-size: 0.8rem;">Опубликована: ${window.utils.formatDate(task.created_at)}</span>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="viewTaskDetails('${task.task_id}')" class="btn btn-secondary">
                                                Подробнее
                                            </button>
                                            ${(isAdmin || task.owner_id === currentUserId) ? `
                                                <button onclick="window.deleteTaskAdmin('${task.task_id}')" class="btn" style="background-color: #ef4444; color: white;">
                                                    Удалить
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d; text-align: center; padding: 2rem;">На данный момент нет открытых задач.</p>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading tasks:', error);
        return `
            <div class="empty-state">
                <h3>Ошибка загрузки</h3>
                <p>Не удалось получить список задач: ${error.message}</p>
            </div>
        `;
    }
});
