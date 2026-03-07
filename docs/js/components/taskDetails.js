// Task details page component
window.router.register('task-details', async function(props) {
    if (!props || !props.id) {
        return `
            <div class="empty-state">
                <h3>Ошибка</h3>
                <p>Задача не найдена или ID не указан</p>
                <button onclick="window.router.navigate('tasks')" class="btn btn-primary">Вернуться к задачам</button>
            </div>
        `;
    }

    try {
        const taskId = props.id;
        console.log('[TaskDetails] Loading task:', taskId);
        
        // Fetch task details
        const response = await window.api.getTask(taskId);
        const task = response.data || response; // Handle {success, data} wrapper if present
        
        if (!task) {
            throw new Error('Задача не найдена');
        }

        // Parse JWT to check for ADMIN role
        let isAdmin = false;
        let currentUserId = null;
        if (window.auth.isLoggedIn()) {
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

        const isOwner = window.auth.isLoggedIn() && currentUserId === task.owner_id;
        const statusMap = {
            'OPEN': 'Открыта',
            'MATCHED': 'В работе',
            'COMPLETED': 'Завершена',
            'CANCELLED': 'Отменена'
        };

        const statusClass = `status-${(task.status || 'OPEN').toLowerCase()}`;
        const statusText = statusMap[task.status || 'OPEN'] || task.status;

        // Render tags
        const tagsHtml = task.tags && task.tags.length > 0
            ? `<div class="task-tags" style="margin-bottom: 1.5rem;">
                ${task.tags.map(tag => `<span class="tag" style="background: #e1f5fe; color: #0288d1; padding: 4px 12px; border-radius: 16px; font-size: 0.9rem; margin-right: 8px;">${tag}</span>`).join('')}
               </div>`
            : '';

        // Worker application logic
        let actionFormHtml = '';
        if (task.status === 'OPEN' && window.auth.isLoggedIn() && !isOwner) {
            actionFormHtml = `
                <div class="card" style="margin-top: 2rem;">
                    <h3>Откликнуться на задачу</h3>
                    <form id="applyTaskForm" onsubmit="submitApplication(event, '${taskId}')">
                        <div class="form-group" style="margin-top: 1rem;">
                            <label for="applyMessage">Сообщение заказчику</label>
                            <textarea id="applyMessage" required rows="4" placeholder="Опишите ваш опыт и почему вы подходите для этой задачи..."></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary">Отправить отклик</button>
                    </form>
                </div>
            `;
        } else if (!window.auth.isLoggedIn()) {
            actionFormHtml = `
                <div class="card" style="margin-top: 2rem; text-align: center;">
                    <p style="margin-bottom: 1rem;">Авторизуйтесь, чтобы откликнуться на задачу</p>
                    <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-primary">Войти</button>
                </div>
            `;
        } else if (isOwner) {
            let applicationsHtml = '<p style="color: #7f8c8d;">Нет откликов</p>';
            try {
                const appsResponse = await window.api.getApplications(taskId);
                const apps = appsResponse.data?.applications || [];
                
                if (apps.length > 0) {
                    applicationsHtml = `
                        <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 1rem;">
                            ${apps.map(app => `
                                <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fff;">
                                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                                        ${app.user?.avatar 
                                            ? `<img src="${app.user.avatar}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">`
                                            : `<div style="width: 40px; height: 40px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; color: #7f8c8d;">${(app.user?.fullName || '?').charAt(0).toUpperCase()}</div>`
                                        }
                                        <div style="flex-grow: 1;">
                                            <div style="font-weight: bold; color: #2c3e50;">${app.user?.fullName || app.user?.email || 'Неизвестный пользователь'}</div>
                                            <div style="font-size: 0.85rem; color: #7f8c8d;">Рейтинг: ${app.user?.rating ? app.user.rating.toFixed(1) : '—'} • Выполнено задач: ${app.user?.completedTasks || 0}</div>
                                        </div>
                                        <span class="task-status status-${app.status.toLowerCase()}" style="font-size: 0.8rem;">${app.status === 'PENDING' ? 'Ожидает' : app.status === 'ACCEPTED' ? 'Принят' : app.status === 'REJECTED' ? 'Отклонен' : app.status}</span>
                                    </div>
                                    <div style="margin-bottom: 15px; color: #34495e; line-height: 1.5; white-space: pre-wrap; font-size: 0.95rem;">${app.message}</div>
                                    ${app.status === 'PENDING' ? `
                                        <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'ACCEPTED', '${taskId}')" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9rem;">Принять</button>
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'REJECTED', '${taskId}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">Отклонить</button>
                                            <button onclick="window.router.navigate('profile', { id: '${app.worker_id}' })" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">Профиль</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">✉️ Сообщение</button>
                                        </div>
                                    ` : app.status === 'ACCEPTED' ? `
                                        <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'REJECTED', '${taskId}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem; color: #e74c3c; border-color: #e74c3c;">Отменить кандидата</button>
                                            <button onclick="window.router.navigate('profile', { id: '${app.worker_id}' })" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">Профиль исполнителя</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">✉️ Написать</button>
                                        </div>
                                    ` : app.status === 'REJECTED' ? `
                                        <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                                            <button onclick="window.updateApplicationStatus('${app.application_id}', 'ACCEPTED', '${taskId}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem; color: #2ecc71; border-color: #2ecc71;">Принять кандидата</button>
                                            <button onclick="window.router.navigate('profile', { id: '${app.worker_id}' })" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">Профиль исполнителя</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">✉️ Написать</button>
                                        </div>
                                    ` : `
                                        <div style="display: flex; gap: 10px; border-top: 1px solid #eee; padding-top: 15px;">
                                            <button onclick="window.router.navigate('profile', { id: '${app.worker_id}' })" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">Профиль исполнителя</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-secondary" style="padding: 6px 15px; font-size: 0.9rem;">✉️ Написать</button>
                                        </div>
                                    `}
                                    <div id="inline-msg-form-${app.worker_id}" style="display: none; margin-top: 15px; padding-top: 15px; border-top: 1px solid #eee;">
                                        <textarea id="inline-msg-text-${app.worker_id}" rows="3" placeholder="Напишите сообщение..." style="width: 100%; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                        <div style="display: flex; gap: 10px;">
                                            <button onclick="window.sendInlineMessage('${app.worker_id}')" class="btn btn-primary" style="padding: 6px 15px; font-size: 0.9rem;">Отправить</button>
                                            <button onclick="window.toggleInlineMessageForm('${app.worker_id}')" class="btn btn-outline" style="padding: 6px 15px; font-size: 0.9rem;">Отмена</button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
            } catch (e) {
                console.error('Error loading applications:', e);
                applicationsHtml = `<p style="color: #e74c3c;">Ошибка загрузки откликов: ${e.message}</p>`;
            }

            actionFormHtml = `
                <div class="card" style="margin-top: 2rem; background: #f8f9fa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3 style="margin: 0;">Отклики кандидатов</h3>
                    </div>
                    ${applicationsHtml}
                </div>
            `;
        }

        return `
            <div class="task-details-page">
                <div style="display: flex; align-items: center; margin-bottom: 1rem;">
                    <a href="#" onclick="event.preventDefault(); window.history.back() || window.router.navigate('tasks')" style="color: #3498db; text-decoration: none; display: flex; align-items: center;">
                        <span style="font-size: 1.2rem; margin-right: 5px;">&larr;</span> Назад
                    </a>
                </div>
                
                <div class="card">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                        <h1 style="margin: 0; font-size: 2rem; color: #2c3e50;">${task.title}</h1>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            ${(isAdmin || isOwner) ? `
                                <button onclick="window.deleteTaskAdmin('${task.task_id}')" class="btn" style="background-color: #ef4444; color: white; padding: 6px 16px;">
                                    Удалить задачу
                                </button>
                            ` : ''}
                            <span class="task-status ${statusClass}" style="font-size: 1rem; padding: 6px 16px;">${statusText}</span>
                        </div>
                    </div>
                    
                    ${task.author ? `
                        <div style="display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; padding: 8px 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #eee;">
                            ${task.author.avatar_url 
                                ? `<img src="${task.author.avatar_url}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">`
                                : `<div style="width: 32px; height: 32px; border-radius: 50%; background: #e0e0e0; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold; color: #7f8c8d;">${(task.author.name || '?').charAt(0).toUpperCase()}</div>`
                            }
                            <div>
                                <div style="font-size: 0.95rem; font-weight: bold; color: #2c3e50; line-height: 1;">${task.author.name || 'Пользователь не указал имя'}</div>
                                <div style="font-size: 0.75rem; color: #95a5a6; margin-top: 4px;">Заказчик</div>
                            </div>
                            
                            ${(!isOwner && window.auth.isLoggedIn()) ? `
                                <button onclick="window.router.navigate('messages')" class="btn btn-secondary" style="margin-left: 15px; padding: 4px 10px; font-size: 0.8rem;">✉️ Сообщение</button>
                            ` : ''}
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 20px; color: #7f8c8d; margin-bottom: 1.5rem; font-size: 1.1rem;">
                        <div>
                            <strong>Бюджет:</strong> <span style="color: #27ae60; font-weight: bold;">${window.utils.formatCurrency(task.budget_estimate || 0)}</span>
                        </div>
                        <div>
                            <strong>Срок:</strong> ${window.utils.formatDate(task.deadline)}
                        </div>
                        <div>
                            <strong>Создано:</strong> ${window.utils.formatDate(task.created_at)}
                        </div>
                    </div>
                    
                    ${tagsHtml}
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;">Описание</h3>
                        <div style="line-height: 1.6; color: #34495e; white-space: pre-wrap;">${task.description}</div>
                    </div>
                </div>
                
                ${actionFormHtml}
            </div>
        `;
    } catch (error) {
        console.error('[TaskDetails] Error loading task:', error);
        return `
            <div class="empty-state">
                <h3>Ошибка загрузки задачи</h3>
                <p>${error.message}</p>
                <button onclick="window.router.navigate('tasks')" class="btn btn-primary">Вернуться к списку задач</button>
            </div>
        `;
    }
});

// Global application handler
window.submitApplication = async function(event, taskId) {
    event.preventDefault();
    const btn = event.target.querySelector('button[type="submit"]');
    const message = document.getElementById('applyMessage').value;
    
    if (!message || message.trim().length < 10) {
        window.utils.showToast('Сообщение должно быть не менее 10 символов', 'warning');
        return;
    }

    try {
        btn.disabled = true;
        btn.textContent = 'Отправка...';
        
        await window.api.applyToTask(taskId, message);
        
        window.utils.showToast('Вы успешно откликнулись на задачу!', 'success');
        
        // Refresh page silently to update status
        window.router.navigate('task-details', { id: taskId });
    } catch (error) {
        console.error('[TaskDetails] Error applying:', error);
        window.utils.showToast(error.message || 'Ошибка при отправке отклика', 'error');
        btn.disabled = false;
        btn.textContent = 'Отправить отклик';
    }
};

// Handle application status update (accept/reject)
window.updateApplicationStatus = async function(applicationId, newStatus, taskId) {
    if (!confirm(`Вы уверены, что хотите ${newStatus === 'ACCEPTED' ? 'принять' : 'отклонить'} этого кандидата?`)) {
        return;
    }
    
    try {
        await window.api.request(`/applications/${applicationId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        });
        
        window.utils.showToast(newStatus === 'ACCEPTED' ? 'Кандидат принят!' : 'Кандидат отклонен', 'success');
        
        // Refresh page to show updated status
        if (taskId) {
            window.router.navigate('task-details', { id: taskId }, { force: true });
        } else {
            // Fallback just in case
            window.router.navigate('tasks');
        }
    } catch (error) {
        console.error('[TaskDetails] Error updating application:', error);
        window.utils.showToast(error.message || 'Ошибка обновления статуса', 'error');
    }
};

// Handle inline message form toggle
window.toggleInlineMessageForm = function(workerId) {
    const formEl = document.getElementById(`inline-msg-form-${workerId}`);
    if (formEl) {
        formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
    }
};

// Send inline message
window.sendInlineMessage = async function(workerId) {
    const textEl = document.getElementById(`inline-msg-text-${workerId}`);
    const message = textEl ? textEl.value.trim() : '';

    if (!message) {
        window.utils.showToast('Введите текст сообщения', 'warning');
        return;
    }

    try {
        const btn = document.querySelector(`#inline-msg-form-${workerId} .btn-primary`);
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Отправка...';
        }

        await window.api.sendMessage(workerId, message);
        window.utils.showToast('Сообщение отправлено!', 'success');
        
        // Hide and clear form
        textEl.value = '';
        window.toggleInlineMessageForm(workerId);
        
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Отправить';
        }
    } catch (error) {
        console.error('Error sending inline message:', error);
        window.utils.showToast(error.message || 'Ошибка при отправке', 'error');
        const btn = document.querySelector(`#inline-msg-form-${workerId} .btn-primary`);
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'Отправить';
        }
    }
};
