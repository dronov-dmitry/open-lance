// Profile page component
async function renderProfilePage() {
    if (!window.auth.isLoggedIn()) {
        return `
            <div class="empty-state">
                <h3>Необходима авторизация</h3>
                <p>Войдите в систему, чтобы просмотреть свой профиль</p>
                <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-primary">
                    Войти
                </button>
            </div>
        `;
    }

    try {
        const user = await window.api.getProfile('me');
        
        return `
            <div class="profile-page">
                <div class="card">
                    <div class="profile-header">
                        <div class="profile-avatar">
                            ${user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div class="profile-info">
                            <h2>${user.email || 'Пользователь'}</h2>
                            <p style="color: #7f8c8d;">ID: ${user.user_id}</p>
                            <div class="rating">
                                <div class="rating-item">
                                    <span class="star">⭐</span>
                                    <strong>Как заказчик:</strong> 
                                    ${user.rating_as_client ? user.rating_as_client.toFixed(1) : 'Нет оценок'}
                                    <span style="color: #7f8c8d;">(${user.completed_tasks_client || 0} задач)</span>
                                </div>
                                <div class="rating-item">
                                    <span class="star">⭐</span>
                                    <strong>Как исполнитель:</strong> 
                                    ${user.rating_as_worker ? user.rating_as_worker.toFixed(1) : 'Нет оценок'}
                                    <span style="color: #7f8c8d;">(${user.completed_tasks_worker || 0} задач)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem; margin-top: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3>Контактные ссылки</h3>
                            <button onclick="showAddContactModal()" class="btn btn-primary btn-sm">
                                Добавить ссылку
                            </button>
                        </div>
                        ${user.contact_links && user.contact_links.length > 0 ? `
                            <div class="contact-links">
                                ${user.contact_links.map((link, index) => `
                                    <div class="contact-link">
                                        <span>${link.label}</span>
                                        <a href="${link.url}" target="_blank" rel="noopener">
                                            ${link.url}
                                        </a>
                                        <button onclick="removeContactLink(${index})" 
                                                style="margin-left: auto; background: transparent; border: none; color: var(--danger-color); cursor: pointer;">
                                            ✕
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <p style="color: #7f8c8d;">Нет контактных ссылок. Добавьте Telegram, WhatsApp или другие способы связи.</p>
                        `}
                    </div>
                </div>

                <div class="card" style="margin-top: 2rem;">
                    <h3 style="margin-bottom: 1rem;">Статистика</h3>
                    <div class="grid grid-2">
                        <div>
                            <h4 style="color: var(--primary-color); font-size: 2rem; margin-bottom: 0.5rem;">
                                ${user.completed_tasks_client || 0}
                            </h4>
                            <p style="color: #7f8c8d;">Задач создано</p>
                        </div>
                        <div>
                            <h4 style="color: var(--success-color); font-size: 2rem; margin-bottom: 0.5rem;">
                                ${user.completed_tasks_worker || 0}
                            </h4>
                            <p style="color: #7f8c8d;">Задач выполнено</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Add Contact Link Modal -->
            <div id="addContactModal" class="modal">
                <div class="modal-content">
                    <span class="close" onclick="closeAddContactModal()">&times;</span>
                    <h2>Добавить контактную ссылку</h2>
                    <form id="addContactForm" onsubmit="handleAddContact(event)">
                        <div class="form-group">
                            <label for="contactLabel">Название *</label>
                            <input type="text" id="contactLabel" placeholder="например: Telegram" required>
                        </div>
                        <div class="form-group">
                            <label for="contactUrl">URL *</label>
                            <input type="url" id="contactUrl" placeholder="https://t.me/username" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width: 100%;">
                            Добавить
                        </button>
                    </form>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error loading profile:', error);
        return `
            <div class="empty-state">
                <h3>Ошибка загрузки профиля</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Global functions for profile operations
window.showAddContactModal = function() {
    document.getElementById('addContactModal').classList.add('active');
};

window.closeAddContactModal = function() {
    document.getElementById('addContactModal').classList.remove('active');
};

window.handleAddContact = async function(event) {
    event.preventDefault();
    
    const linkData = {
        label: document.getElementById('contactLabel').value,
        url: document.getElementById('contactUrl').value
    };

    try {
        await window.api.addContactLink(linkData);
        window.utils.showToast('Контактная ссылка добавлена', 'success');
        window.closeAddContactModal();
        window.router.navigate('profile');
    } catch (error) {
        window.utils.showToast(error.message || 'Ошибка добавления ссылки', 'error');
    }
};

window.removeContactLink = async function(index) {
    if (!confirm('Удалить эту контактную ссылку?')) return;

    try {
        await window.api.removeContactLink(index);
        window.utils.showToast('Контактная ссылка удалена', 'success');
        window.router.navigate('profile');
    } catch (error) {
        window.utils.showToast(error.message || 'Ошибка удаления ссылки', 'error');
    }
};

// Register route
window.router.register('profile', renderProfilePage);
