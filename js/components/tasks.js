// Tasks component
window.router.register('tasks', async function() {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    if (!window.auth.isLoggedIn()) {
        return window.utils.renderAuthRequired(tr('tasks.authRequired'));
    }

    try {
        const cached = localStorage.getItem('all-tasks-cache');
        const cacheTime = localStorage.getItem('all-tasks-cache-time');
        const CACHE_TTL = 1 * 60 * 1000;
        
        let allTasks = [];
        let fromCache = false;
        
        if (cached && cacheTime && (Date.now() - parseInt(cacheTime)) < CACHE_TTL) {
            allTasks = JSON.parse(cached);
            fromCache = true;
        }
        
        const fetchData = async () => {
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
                    <p style="margin-top: 1rem; color: #7f8c8d;">${tr('tasks.loadList')}</p>
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

        const now = new Date();
        allTasks = allTasks.filter(task => !task.deadline || new Date(task.deadline) >= now);

        let isAdmin = false;
        let currentUserId = null;
        const payload = window.auth.getJwtPayload();
        if (payload) {
            isAdmin = payload.role === 'ADMIN';
            currentUserId = payload.userId;
        }

        window.deleteTaskAdmin = async (taskId) => {
            if (!confirm(tr('tasks.confirmDelete'))) return;
            try {
                await window.api.request(`/tasks/${taskId}`, { method: 'DELETE' });
                window.utils.showToast(tr('tasks.deleted'), 'success');
                localStorage.removeItem('all-tasks-cache');
                localStorage.removeItem('all-tasks-cache-time');
                window.router.navigate('tasks', { replace: true });
            } catch (e) {
                window.utils.showToast(e.message || tr('tasks.deleteError'), 'error');
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
                    <h1 style="margin: 0;">${tr('tasks.allOpen')}</h1>
                    ${window.auth.isLoggedIn() ? `
                        <button class="btn btn-primary" onclick="document.getElementById('createTaskModal').classList.add('active')">
                            ${tr('tasks.createTask')}
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
                                            <a href="#" onclick="window.router.navigate('profile', { id: '${task.owner_id}' }); return false;" style="font-size: 0.85rem; font-weight: bold; color: var(--primary-color); text-decoration: none;">${task.author.name || task.author.email || tr('tasks.noName')}</a>
                                        </div>
                                    ` : ''}
                                    <p style="color: #7f8c8d; margin-bottom: 1rem;">
                                        ${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}
                                    </p>
                                    <div style="margin-bottom: 1rem;">
                                        <strong>${tr('tasks.budget')}:</strong> ${window.utils.formatCurrency(task.budget_estimate)}
                                        <br>
                                        <strong>${tr('tasks.deadline')}:</strong> ${window.utils.formatDate(task.deadline)}
                                    </div>
                                    <div class="task-footer">
                                        <span style="font-size: 0.8rem;">${tr('tasks.published')}: ${window.utils.formatDate(task.created_at)}</span>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="viewTaskDetails('${task.task_id}')" class="btn btn-secondary">${tr('tasks.more')}</button>
                                            ${(isAdmin || task.owner_id === currentUserId) ? `
                                                <button onclick="window.deleteTaskAdmin('${task.task_id}')" class="btn" style="background-color: #ef4444; color: white;">${tr('tasks.delete')}</button>
                                            ` : ''}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: #7f8c8d; text-align: center; padding: 2rem;">${tr('tasks.noTasks')}</p>
                    `}
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading tasks:', error);
        const msg = (error && error.message) ? String(error.message) : '';
        const isUnauthorized = /Unauthorized|401|authorization|токен|token/i.test(msg);
        let title = tr('tasks.loadError');
        let description = (msg || '') + '.';
        if (isUnauthorized) {
            title = tr('tasks.unauthorizedTitle');
            description = '<p style="margin-bottom: 0.75rem;">' + tr('tasks.unauthorizedDesc') + '</p><p style="margin-top: 1rem;"><button type="button" class="btn btn-primary" onclick="document.getElementById(\'authBtn\').click()">' + tr('nav.login') + '</button></p>';
        }
        return `
            <div class="empty-state">
                <h3>${title}</h3>
                <div class="empty-state-description">${description}</div>
            </div>
        `;
    }
});
