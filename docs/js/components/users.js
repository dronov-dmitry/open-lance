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

// Toggle inline review form in user card
window.toggleUserReviewForm = function(userId) {
    const formEl = document.getElementById('user-review-form-' + userId);
    if (formEl) {
        formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
    }
};

// Submit review directly from users list
window.submitUserReview = async function(userId) {
    if (!window.auth.isLoggedIn()) {
        window.utils.showToast('Войдите в систему, чтобы оставить отзыв', 'warning');
        document.getElementById('loginModal').classList.add('active');
        return;
    }

    const ratingEl = document.getElementById('user-review-rating-' + userId);
    const textEl   = document.getElementById('user-review-text-'   + userId);
    const rating  = parseInt(ratingEl ? ratingEl.value : '5', 10);
    const comment = textEl ? textEl.value.trim() : '';

    if (comment.length < 5) {
        window.utils.showToast('Отзыв слишком короткий (минимум 5 символов)', 'warning');
        return;
    }

    const btn = document.querySelector('#user-review-form-' + userId + ' .btn-primary');
    try {
        if (btn) { btn.disabled = true; btn.textContent = 'Отправка...'; }
        await window.api.submitProfileReview(userId, rating, comment);
        window.utils.showToast('Отзыв успешно добавлен!', 'success');
        if (textEl) textEl.value = '';
        window.toggleUserReviewForm(userId);
    } catch (error) {
        console.error('Error submitting user review:', error);
        window.utils.showToast(error.message || 'Ошибка при отправке отзыва', 'error');
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Опубликовать'; }
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
            let roleText = '';
            let roleClass = 'freelancer';

            if (user.role === 'ADMIN') {
                roleText = 'Администратор';
                roleClass = 'admin';
            } else if (user.role === 'client') {
                roleText = 'Заказчик';
            }

            const isBanned = user.status === 'BANNED';
            const banBadge = isBanned ? '<span class="badge error">ЗАБЛОКИРОВАН</span>' : '';

            let actionButtons = `
                <button onclick="window.router.navigate('profile', { id: '${user.user_id}' });" class="btn btn-secondary" style="font-size: 0.8rem; padding: 5px 10px; margin-right: 10px; margin-top: 10px;">
                    Подробнее
                </button>
            `;

            const isOtherUser = currentUserId && currentUserId !== user.user_id && !isBanned;

            if (isOtherUser) {
                actionButtons += `
                    <button onclick="window.router.navigate('messages'); setTimeout(() => window.showReplyBox('${user.user_id}', '${(user.name || 'Без имени').replace(/'/g, "\\'")}'), 100);" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px; margin-right: 10px; margin-top: 10px;">
                        ✉️ Написать сообщение
                    </button>
                `;
            }

            // Review button and inline form
            const reviewFormHtml = isOtherUser ? `
                <button onclick="window.toggleUserReviewForm('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; margin-right: 10px; margin-top: 10px; color: #2c3e50; border-color: #2c3e50;">
                    ⭐ Отзыв
                </button>
                <div id="user-review-form-${user.user_id}" style="display: none; margin-top: 12px; padding: 12px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                    <strong style="display: block; margin-bottom: 8px; font-size: 0.9rem;">Оставить отзыв</strong>
                    <select id="user-review-rating-${user.user_id}" style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; margin-bottom: 8px; font-family: inherit;">
                        <option value="5">⭐⭐⭐⭐⭐ (5) Отлично</option>
                        <option value="4">⭐⭐⭐⭐ (4) Хорошо</option>
                        <option value="3">⭐⭐⭐ (3) Нормально</option>
                        <option value="2">⭐⭐ (2) Плохо</option>
                        <option value="1">⭐ (1) Ужасно</option>
                    </select>
                    <textarea id="user-review-text-${user.user_id}" rows="3" placeholder="Расскажите об опыте работы с пользователем..." style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical; margin-bottom: 8px;"></textarea>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="window.toggleUserReviewForm('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 12px; color: #2c3e50; border-color: #2c3e50;">Отмена</button>
                        <button onclick="window.submitUserReview('${user.user_id}')" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 12px;">Опубликовать</button>
                    </div>
                </div>
            ` : '';

            if (isAdmin) {
                actionButtons += `
                    <div class="admin-controls" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        ${user.role !== 'ADMIN' ? `<button onclick="window.makeAdmin('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; color: #2c3e50; border-color: #2c3e50;">Сделать админом</button>` : ''}
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
                    ${reviewFormHtml}
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
