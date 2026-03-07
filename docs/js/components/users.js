// Users Component

// Helper to decode JWT
function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        return null;
    }
}

// Admin Action Handlers
window.makeAdmin = async (userId) => {
    if (!confirm('Вы уверены, что хотите назначить этого пользователя администратором?')) return;
    try {
        await window.api.updateUserRole(userId, 'ADMIN');
        window.utils.showToast('Роль успешно обновлена', 'success');
        window.router.navigate('users'); // Refresh
    } catch (error) {
        window.utils.showToast(error.message, 'error');
    }
};

window.banUser = async (userId) => {
    if (!confirm('Вы уверены, что хотите заблокировать этого пользователя?')) return;
    try {
        await window.api.updateUserStatus(userId, 'BANNED');
        window.utils.showToast('Пользователь заблокирован', 'success');
        window.router.navigate('users'); // Refresh
    } catch (error) {
        window.utils.showToast(error.message, 'error');
    }
};

window.router.register('users', async () => {
    try {
        const response = await window.api.getUsers();
        const users = response.data || response;
        
        // Determine if current user is admin and get their ID
        let isAdmin = false;
        let currentUserId = null;
        const currentToken = window.api.getAuthToken();
        if (currentToken) {
            const payload = parseJwt(currentToken);
            if (payload) {
                if (payload.role === 'ADMIN') isAdmin = true;
                currentUserId = payload.userId;
            }
        }

        if (users.length === 0) {
            return `
                <div class="users-container">
                    <h2>Зарегистрированные пользователи</h2>
                    <p>Пользователей пока нет.</p>
                </div>
            `;
        }
        
        let usersHtml = '<div class="users-grid">';
        
        users.forEach(user => {
            // Updated roles parsing (fallback to old ones just in case)
            let roleText = 'Фрилансер';
            let roleClass = 'freelancer';
            
            if (user.role === 'ADMIN') {
                roleText = 'Администратор';
                roleClass = 'admin';
            } else if (user.role === 'USER') {
                roleText = 'Пользователь';
                roleClass = 'freelancer';
            } else if (user.role === 'client') {
                roleText = 'Заказчик';
            }

            // Banned Badge
            const isBanned = user.status === 'BANNED';
            const banBadge = isBanned ? '<span class="badge error">ЗАБЛОКИРОВАН</span>' : '';
                             
            let actionButtons = `
                <button onclick="window.router.navigate('profile', { id: '${user.user_id}' });" class="btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px; margin-right: 10px; margin-top: 10px;">
                    Подробнее
                </button>
            `;
            
            // "Send Message" button for any user other than self
            if (currentUserId && currentUserId !== user.user_id && !isBanned) {
                // Assuming messages.js exposes a global `window.openComposeBox(targetUserId, targetUserName)` 
                // We'll use our `showReplyBox` logic from messages.js by registering a global function in `app.js` or directly using window.location hash routing
                // For simplicity, we can route them to messages and trigger the reply box
                actionButtons += `
                    <button onclick="window.router.navigate('messages'); setTimeout(() => window.showReplyBox('${user.user_id}', '${(user.name || 'Без имени').replace(/'/g, "\\'")}'), 100);" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px; margin-right: 10px; margin-top: 10px;">
                        ✉️ Написать сообщение
                    </button>
                `;
            }

            if (isAdmin) {
                actionButtons += `
                    <div class="admin-controls" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        ${user.role !== 'ADMIN' ? `<button onclick="window.makeAdmin('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px;">Сделать админом</button>` : ''}
                        ${!isBanned ? `<button onclick="window.banUser('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; border-color: var(--error-color); color: var(--error-color);">Заблокировать</button>` : ''}
                    </div>
                `;
            }

            usersHtml += `
                <div class="user-card card ${isBanned ? 'banned' : ''}" style="${isBanned ? 'opacity: 0.6;' : ''}">
                    <div class="user-header">
                        <h3>${user.name || 'Без имени'} <span class="badge ${roleClass}">${roleText}</span> ${banBadge}</h3>
                        <p class="user-email">${user.email}</p>
                    </div>
                    <div class="user-stats">
                        <div class="stat">
                            <span class="stat-label">Рейтинг заказчика:</span>
                            <span class="stat-val">${user.rating_as_client ? user.rating_as_client.toFixed(1) : '—'}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Рейтинг фрилансера:</span>
                            <span class="stat-val">${user.rating_as_worker ? user.rating_as_worker.toFixed(1) : '—'}</span>
                        </div>
                    </div>
                    ${actionButtons}
                </div>
            `;
        });
        
        usersHtml += '</div>';
        
        return `
            <div class="users-container">
                <h2>Зарегистрированные пользователи</h2>
                ${usersHtml}
            </div>
        `;
    } catch (error) {
        console.error('[Users] Error loading users:', error);
        return `
            <div class="users-container">
                <h2>Зарегистрированные пользователи</h2>
                <p class="error">Ошибка при загрузке пользователей: ${error.message}</p>
            </div>
        `;
    }
});
