// Users Component
// import { form_auth_message } from './messages.js';  // Именованный импорт
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

    // Check if can review
    try {
        const canReviewResp = await window.api.canReviewUser(userId);
        const canReview = (canReviewResp.data || canReviewResp).canReview;
        if (!canReview) {
            const reason = (canReviewResp.data || canReviewResp).reason || 'Вы не можете оставить отзыв этому пользователю';
            window.utils.showToast(reason, 'warning');
            return;
        }
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        window.utils.showToast('Ошибка при проверке возможности оставить отзыв', 'error');
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
        // Reload page to update UI
        window.router.navigate('users', {}, { force: true });
    } catch (error) {
        console.error('Error submitting user review:', error);
        const errorMsg = error.message || 'Ошибка при отправке отзыва';
        if (errorMsg.includes('accepting their application')) {
            window.utils.showToast('Вы можете оставить отзыв только после принятия отклика на задачу', 'warning');
        } else {
            window.utils.showToast(errorMsg, 'error');
        }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Опубликовать'; }
    }
};

window.router.register('users', async () => {
    if (!window.auth.isLoggedIn()) {
				return window.form_auth_message("список фрилансеров");
    }

    // Get filter from URL or use default
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
    const currentSpecializationFilter = urlParams.get('specialization') || '';
    const currentSortBy = urlParams.get('sortBy') || '';
    const currentSortOrder = urlParams.get('sortOrder') || 'desc';
    
    // Function to apply filters
    window.applyUsersFilter = async () => {
        const specializationSelect = document.getElementById('users-specialization-filter');
        const sortBySelect = document.getElementById('users-sort-by');
        const sortOrderSelect = document.getElementById('users-sort-order');
        
        const specializationValue = specializationSelect ? specializationSelect.value : '';
        const sortByValue = sortBySelect ? sortBySelect.value : '';
        const sortOrderValue = sortOrderSelect ? sortOrderSelect.value : 'desc';
        
        // Update URL directly and trigger popstate to reload component
        const params = new URLSearchParams();
        if (specializationValue) params.set('specialization', specializationValue);
        if (sortByValue) params.set('sortBy', sortByValue);
        if (sortOrderValue) params.set('sortOrder', sortOrderValue);
        const newHash = '#/users' + (params.toString() ? '?' + params.toString() : '');
        window.location.hash = newHash;
        
        // Trigger popstate event to reload the component
        window.dispatchEvent(new Event('popstate'));
    };
    
    try {
        // Fetch specializations list first
        let specializationsList = [];
        try {
            const specsResponse = await window.api.getSpecializations();
            specializationsList = (specsResponse.data || specsResponse).specializations || [];
        } catch (error) {
            console.error('[Users] Error loading specializations:', error);
        }
        
        // Build filters object from URL params
        const filters = {};
        if (currentSpecializationFilter) {
            filters.specialization = currentSpecializationFilter;
        }
        if (currentSortBy) {
            filters.sortBy = currentSortBy;
            filters.sortOrder = currentSortOrder;
        }
        
        console.log('[Users] Loading users with filters:', filters);
        const response = await window.api.getUsers(filters);
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

        // Check review eligibility for all users in parallel
        const reviewChecks = await Promise.all(
            users.map(async (user) => {
                if (!currentUserId || currentUserId === user.user_id || user.status === 'BANNED') {
                    return { userId: user.user_id, canReview: false };
                }
                try {
                    const canReviewResp = await window.api.canReviewUser(user.user_id);
                    const canReview = (canReviewResp.data || canReviewResp).canReview;
                    return { userId: user.user_id, canReview };
                } catch (error) {
                    console.error(`[Users] Error checking review eligibility for ${user.user_id}:`, error);
                    return { userId: user.user_id, canReview: false };
                }
            })
        );
        
        const reviewEligibilityMap = {};
        reviewChecks.forEach(check => {
            reviewEligibilityMap[check.userId] = check.canReview;
        });

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
                <div class="user-card-actions">
                <button type="button" data-profile-id="${user.user_id}" class="btn btn-secondary btn-profile-link" style="font-size: 0.8rem; padding: 5px 10px;">
                    Подробнее
                </button>
            `;

            const isOtherUser = currentUserId && currentUserId !== user.user_id && !isBanned;

            if (isOtherUser) {
                actionButtons += `
                    <button onclick="window.router.navigate('messages'); setTimeout(() => window.showReplyBox('${user.user_id}', '${(user.name || 'Без имени').replace(/'/g, "\\'")}'), 100);" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px;">
                        ✉️ Написать сообщение
                    </button>
                `;
            }

            // Review button and inline form - only show if user can review
            const canReview = reviewEligibilityMap[user.user_id] || false;
            if (isOtherUser && canReview) {
                actionButtons += `
                    <button onclick="window.toggleUserReviewForm('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; color: #2c3e50; border-color: #2c3e50;">
                        ⭐ Отзыв
                    </button>
                `;
            }
            const reviewFormHtml = (isOtherUser && canReview) ? `
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
                actionButtons += `</div><div class="admin-controls" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        ${user.role !== 'ADMIN' ? `<button onclick="window.makeAdmin('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; color: #2c3e50; border-color: #2c3e50;">Сделать админом</button>` : ''}
                        ${!isBanned ? `<button onclick="window.banUser('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; border-color: var(--error-color); color: var(--error-color);">Заблокировать</button>` : ''}
                    </div>`;
            } else {
                actionButtons += `</div>`;
            }

            usersHtml += `
                <div class="user-card card ${isBanned ? 'banned' : ''}" style="${isBanned ? 'opacity: 0.6;' : ''}">
                    <div class="user-header">
                        <h3>${user.name || 'Без имени'} <span class="badge ${roleClass}">${roleText}</span> ${banBadge}</h3>
                        <p class="user-email">${user.email}</p>
                        ${user.title ? `<p style="color: var(--primary-color); font-weight: 500; margin-top: 8px; margin-bottom: 0; font-size: 0.95rem;">💼 ${user.title}</p>` : ''}
                    </div>
                    <div class="user-stats">
                        ${user.specializations && Array.isArray(user.specializations) && user.specializations.length > 0 ? `
                            <div class="user-stats-tags" style="margin-bottom: 8px; display: flex; flex-wrap: wrap; gap: 5px; justify-content: center;">
                                ${user.specializations.slice(0, 5).map(spec => `<span style="background: #e8f4f8; color: #2c3e50; padding: 3px 8px; border-radius: 12px; font-size: 0.8rem;">${spec}</span>`).join('')}
                                ${user.specializations.length > 5 ? `<span style="color: #7f8c8d; font-size: 0.8rem;">+${user.specializations.length - 5}</span>` : ''}
                            </div>
                        ` : ''}
                        <div class="user-stats-row">
                            <div class="stat">
                                <span class="stat-label">Рейтинг заказчика:</span>
                                <span class="stat-val">${user.rating_as_client ? user.rating_as_client.toFixed(1) : '—'}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">Рейтинг фрилансера:</span>
                                <span class="stat-val">${user.rating_as_worker ? user.rating_as_worker.toFixed(1) : '—'}</span>
                            </div>
                        </div>
                    </div>
										<div class="user-card-actions">
											<div>
											${actionButtons}
											${reviewFormHtml}
											</div>
											<div>
											${user.hourly_rate ? `<p class="user-header-rate" style="color: #27ae60; font-weight: 500; margin-top: 5px; margin-bottom: 0; font-size: 0.9rem;">💰 ${window.utils.formatCurrency ? window.utils.formatCurrency(user.hourly_rate) + ' в час' : user.hourly_rate.toLocaleString('ru-RU') + ' ₽ в час'}</p>` : ''}
											</div>
										</div>
                </div>
            `;
        });

        usersHtml += '</div>';

        return `
            <div class="users-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="margin: 0;">Зарегистрированные пользователи</h2>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="users-specialization-filter" style="font-weight: 500; white-space: nowrap;">Специализация:</label>
                            <select 
                                id="users-specialization-filter" 
                                style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 200px; background: white;"
                                onchange="window.applyUsersFilter()"
                            >
                                <option value="">Все специализации</option>
                                ${specializationsList.map(spec => `
                                    <option value="${spec}" ${currentSpecializationFilter === spec ? 'selected' : ''}>${spec}</option>
                                `).join('')}
                            </select>
                            ${currentSpecializationFilter ? `
                                <button 
                                    onclick="document.getElementById('users-specialization-filter').value = ''; window.applyUsersFilter();" 
                                    class="btn btn-outline"
                                    style="padding: 8px 16px; white-space: nowrap; color: #2c3e50; border-color: #2c3e50;"
                                >
                                    ✕ Сбросить
                                </button>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="users-sort-by" style="font-weight: 500; white-space: nowrap;">Сортировать по:</label>
                            <select 
                                id="users-sort-by" 
                                style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 180px; background: white;"
                                onchange="window.applyUsersFilter()"
                            >
                                <option value="">Без сортировки</option>
                                <option value="rating_as_worker" ${currentSortBy === 'rating_as_worker' ? 'selected' : ''}>Рейтинг фрилансера</option>
                                <option value="rating_as_client" ${currentSortBy === 'rating_as_client' ? 'selected' : ''}>Рейтинг заказчика</option>
                                <option value="hourly_rate" ${currentSortBy === 'hourly_rate' ? 'selected' : ''}>Стоимость в час</option>
                            </select>
                            ${currentSortBy ? `
                                <select 
                                    id="users-sort-order" 
                                    style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 140px; background: white;"
                                    onchange="window.applyUsersFilter()"
                                >
                                    <option value="desc" ${currentSortOrder === 'desc' ? 'selected' : ''}>По убыванию</option>
                                    <option value="asc" ${currentSortOrder === 'asc' ? 'selected' : ''}>По возрастанию</option>
                                </select>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${users.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <p>Пользователи не найдены${currentSpecializationFilter ? ' по выбранной специализации' : ''}.</p>
                        ${currentSpecializationFilter ? '<p>Попробуйте выбрать другую специализацию.</p>' : ''}
                    </div>
                ` : `
                    <p style="color: #7f8c8d; margin-bottom: 20px;">Найдено: ${users.length} ${users.length === 1 ? 'пользователь' : users.length < 5 ? 'пользователя' : 'пользователей'}</p>
                    ${usersHtml}
                `}
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
