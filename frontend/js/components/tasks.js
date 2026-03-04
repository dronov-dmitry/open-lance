// Tasks page component
async function renderTasksPage() {
    try {
        const tasks = await window.api.getTasks({ status: 'OPEN' });
        
        return `
            <div class="tasks-page">
                <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; background: white; border-radius: 8px; margin-bottom: 2rem;">
                    <h1 class="card-title">Доступные задачи</h1>
                    ${window.auth.isLoggedIn() ? `
                        <button onclick="showCreateTaskModal()" class="btn btn-primary">
                            Создать задачу
                        </button>
                    ` : ''}
                </div>

                <div class="filters" style="margin-bottom: 2rem;">
                    <div class="card">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <select id="categoryFilter" class="form-control" style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 5px;">
                                <option value="">Все категории</option>
                                <option value="Design">Дизайн</option>
                                <option value="Development">Разработка</option>
                                <option value="Writing">Копирайтинг</option>
                                <option value="Marketing">Маркетинг</option>
                                <option value="Other">Другое</option>
                            </select>
                            <input type="text" id="searchInput" placeholder="Поиск..." 
                                   style="padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 5px; flex: 1; min-width: 200px;">
                            <button onclick="filterTasks()" class="btn btn-secondary">Применить</button>
                        </div>
                    </div>
                </div>

                <div id="tasksList" class="grid grid-2">
                    ${tasks && tasks.length > 0 ? tasks.map(task => renderTaskCard(task)).join('') : `
                        <div class="empty-state" style="grid-column: 1 / -1;">
                            <h3>Нет доступных задач</h3>
                            <p>Станьте первым, кто создаст задачу!</p>
                        </div>
                    `}
                </div>
            </div>

            <!-- Create Task Modal -->
            <div id="createTaskModal" class="modal">
                <div class="modal-content" style="max-width: 600px;">
                    <span class="close" onclick="closeCreateTaskModal()">&times;</span>
                    <h2>Создать новую задачу</h2>
                    <form id="createTaskForm" onsubmit="handleCreateTask(event)">
                        <div class="form-group">
                            <label for="taskTitle">Название задачи *</label>
                            <input type="text" id="taskTitle" required>
                        </div>
                        <div class="form-group">
                            <label for="taskDescription">Описание *</label>
                            <textarea id="taskDescription" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="taskCategory">Категория *</label>
                            <select id="taskCategory" required>
                                <option value="">Выберите категорию</option>
                                <option value="Design">Дизайн</option>
                                <option value="Development">Разработка</option>
                                <option value="Writing">Копирайтинг</option>
                                <option value="Marketing">Маркетинг</option>
                                <option value="Other">Другое</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="taskBudget">Бюджет (₽) *</label>
                            <input type="number" id="taskBudget" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="taskDeadline">Срок выполнения *</label>
                            <input type="date" id="taskDeadline" required>
                        </div>
                        <div class="form-group">
                            <label for="taskTags">Теги (через запятую)</label>
                            <input type="text" id="taskTags" placeholder="например: logo, vector, minimalist">
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            Создать задачу
                        </button>
                    </form>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading tasks:', error);
        return `
            <div class="empty-state">
                <h3>Ошибка загрузки задач</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderTaskCard(task) {
    return `
        <div class="task-card">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <h3 class="card-title" style="margin: 0;">${task.title}</h3>
                <span class="task-status status-${task.status.toLowerCase()}">${getStatusText(task.status)}</span>
            </div>
            <p class="card-meta" style="margin-bottom: 1rem;">
                ${task.description.substring(0, 150)}${task.description.length > 150 ? '...' : ''}
            </p>
            <div style="margin-bottom: 1rem;">
                <strong>Категория:</strong> ${task.category}<br>
                <strong>Бюджет:</strong> ${task.budget_estimate} ₽<br>
                <strong>Срок:</strong> ${formatDate(task.deadline)}
            </div>
            ${task.tags && task.tags.length > 0 ? `
                <div class="task-tags">
                    ${task.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            <div class="task-footer">
                <span class="card-meta">${formatDate(task.created_at)}</span>
                ${window.auth.isLoggedIn() ? `
                    <button onclick="applyToTask('${task.task_id}')" class="btn btn-primary">
                        Откликнуться
                    </button>
                ` : `
                    <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-secondary">
                        Войти для отклика
                    </button>
                `}
            </div>
        </div>
    `;
}

function getStatusText(status) {
    const statusMap = {
        'OPEN': 'Открыта',
        'MATCHED': 'В работе',
        'COMPLETED': 'Завершена',
        'CANCELLED': 'Отменена'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Global functions for task operations
window.showCreateTaskModal = function() {
    document.getElementById('createTaskModal').classList.add('active');
};

window.closeCreateTaskModal = function() {
    document.getElementById('createTaskModal').classList.remove('active');
};

window.handleCreateTask = async function(event) {
    event.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        category: document.getElementById('taskCategory').value,
        budget_estimate: parseInt(document.getElementById('taskBudget').value),
        deadline: document.getElementById('taskDeadline').value,
        tags: document.getElementById('taskTags').value.split(',').map(t => t.trim()).filter(t => t)
    };

    try {
        await window.api.createTask(taskData);
        window.utils.showToast('Задача создана успешно', 'success');
        window.closeCreateTaskModal();
        window.router.navigate('tasks');
    } catch (error) {
        window.utils.showToast(error.message || 'Ошибка создания задачи', 'error');
    }
};

window.applyToTask = async function(taskId) {
    if (!window.auth.isLoggedIn()) {
        window.utils.showToast('Необходимо войти в систему', 'warning');
        return;
    }

    const message = prompt('Опишите, почему вы подходите для этой задачи:');
    if (!message) return;

    try {
        await window.api.applyToTask(taskId, message);
        window.utils.showToast('Отклик отправлен', 'success');
    } catch (error) {
        window.utils.showToast(error.message || 'Ошибка отправки отклика', 'error');
    }
};

window.filterTasks = async function() {
    const category = document.getElementById('categoryFilter').value;
    const search = document.getElementById('searchInput').value;
    
    const filters = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    
    try {
        const tasks = await window.api.getTasks(filters);
        const tasksList = document.getElementById('tasksList');
        tasksList.innerHTML = tasks.map(task => renderTaskCard(task)).join('');
    } catch (error) {
        window.utils.showToast('Ошибка фильтрации задач', 'error');
    }
};

// Register route
window.router.register('tasks', renderTasksPage);
