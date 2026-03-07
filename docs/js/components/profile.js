// Profile component
window.router.register('profile', async function(props) {
    const userId = props?.id || 'me';
    const isOwnProfile = userId === 'me';

    if (isOwnProfile && !window.auth.isLoggedIn()) {
        return `
            <div class="empty-state">
                <h3>Необходима авторизация</h3>
                <p>Войдите в систему, чтобы просматривать и редактировать свой профиль</p>
                <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-primary">
                    Войти
                </button>
            </div>
        `;
    }

    // Initialize global state for profile edit mode
    window.profileState = {
        isEditing: false,
        data: null
    };

    window.toggleProfileEdit = () => {
        window.profileState.isEditing = !window.profileState.isEditing;
        window.renderProfileView();
    };

    window.saveProfile = async () => {
        const btn = document.getElementById('saveProfileBtn');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {
            const currencyVal = document.getElementById('edit-profile-currency').value;
            if (window.currencyService) {
                window.currencyService.setPreferredCurrency(currencyVal);
            }

            const updates = {
                name: document.getElementById('edit-profile-name').value.trim(),
                title: document.getElementById('edit-profile-title').value.trim(),
                bio: document.getElementById('edit-profile-bio').value.trim(),
                portfolio_url: document.getElementById('edit-profile-portfolio').value.trim()
            };

            const response = await window.api.request('/users/me', {
                method: 'PUT',
                body: JSON.stringify({ data: updates })
            });

            window.profileState.data = response.data || response;
            window.profileState.isEditing = false;
            window.utils.showToast('Профиль успешно обновлен!', 'success');
            window.renderProfileView();
        } catch (error) {
            window.utils.showToast(error.message || 'Ошибка обновления', 'error');
            btn.disabled = false;
            btn.textContent = 'Сохранить';
        }
    };

    window.changePassword = async function() {
        const oldPass = document.getElementById('edit-profile-old-password').value;
        const newPass = document.getElementById('edit-profile-new-password').value;
        const confPass = document.getElementById('edit-profile-confirm-password').value;

        if (!oldPass || !newPass || !confPass) {
            window.utils.showToast('Пожалуйста, заполните все поля для смены пароля', 'warning');
            return;
        }

        if (newPass !== confPass) {
            window.utils.showToast('Новые пароли не совпадают', 'error');
            return;
        }

        if (newPass.length < 6) {
            window.utils.showToast('Новый пароль должен содержать минимум 6 символов', 'warning');
            return;
        }

        const btn = document.getElementById('changePasswordBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'Обработка...';
        }

        try {
            const resp = await window.api.changePassword(oldPass, newPass);
            window.utils.showToast(resp.message || 'Пароль успешно изменен', 'success');
            
            // Clear inputs
            document.getElementById('edit-profile-old-password').value = '';
            document.getElementById('edit-profile-new-password').value = '';
            document.getElementById('edit-profile-confirm-password').value = '';
        } catch (error) {
            window.utils.showToast(error.message || 'Ошибка смены пароля', 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Изменить пароль';
            }
        }
    };

    window.renderProfileView = () => {
        const container = document.getElementById('profile-content-container');
        if (!container) return;

        const p = window.profileState.data;
        const isEdit = window.profileState.isEditing;

        if (isEdit) {
            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">Редактирование профиля</h2>
                        <button class="btn btn-outline" onclick="window.toggleProfileEdit()">Отмена</button>
                    </div>

                    <div class="form-group">
                        <label for="edit-profile-name">Имя / Никнейм</label>
                        <input type="text" id="edit-profile-name" value="${p.name || ''}" placeholder="Иван Иванов" maxlength="100">
                    </div>

                    <div class="form-group">
                        <label for="edit-profile-title">Специальность (Заголовок)</label>
                        <input type="text" id="edit-profile-title" value="${p.title || ''}" placeholder="Fullstack Разработчик" maxlength="100">
                    </div>

                    <div class="form-group">
                        <label for="edit-profile-bio">О себе</label>
                        <textarea id="edit-profile-bio" rows="6" placeholder="Опишите свои навыки, опыт и технологии с которыми работаете..." maxlength="1000">${p.bio || ''}</textarea>
                    </div>

                    <div class="form-group">
                        <label for="edit-profile-portfolio">URL Портфолио (ссылка на сайт/GitHub/Behance)</label>
                        <input type="url" id="edit-profile-portfolio" value="${p.portfolio_url || ''}" placeholder="https://github.com/username">
                    </div>

                    <div class="form-group">
                        <label for="edit-profile-currency" style="display: block; margin-bottom: 5px;">Валюта отображения</label>
                        <select id="edit-profile-currency" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                            <option value="RUB" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'RUB' ? 'selected' : ''}>₽ Рубль (RUB)</option>
                            <option value="USD" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'USD' ? 'selected' : ''}>$ Доллар (USD)</option>
                            <option value="EUR" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'EUR' ? 'selected' : ''}>€ Евро (EUR)</option>
                            <option value="UAH" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'UAH' ? 'selected' : ''}>₴ Гривна (UAH)</option>
                        </select>
                    </div>

                    <button id="saveProfileBtn" class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="window.saveProfile()">Сохранить</button>
                    
                    <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <h3 style="margin-top: 0; margin-bottom: 15px;">Смена пароля</h3>
                        <div class="form-group">
                            <label for="edit-profile-old-password">Текущий пароль</label>
                            <input type="password" id="edit-profile-old-password" placeholder="Введите текущий пароль">
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-new-password">Новый пароль</label>
                            <input type="password" id="edit-profile-new-password" placeholder="Введите новый пароль (минимум 6 символов)">
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-confirm-password">Подтвердите новый пароль</label>
                            <input type="password" id="edit-profile-confirm-password" placeholder="Повторите новый пароль">
                        </div>
                        <button id="changePasswordBtn" class="btn btn-outline" style="width: 100%;" onclick="window.changePassword()">Изменить пароль</button>
                    </div>
                </div>
            `;
        } else {
            const getInitials = (name, email) => {
                if (name) {
                    const parts = name.trim().split(/\s+/);
                    if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                    } else if (parts[0] && parts[0].length > 0) {
                        return parts[0][0].toUpperCase();
                    }
                }
                if (email && email.length > 0) {
                    return email[0].toUpperCase();
                }
                return '?';
            };

            const fallbackHtml = `<div style="width: 100px; height: 100px; border-radius: 50%; background: #e0e0e0; display: inline-flex; align-items: center; justify-content: center; font-size: 2.5rem; color: #7f8c8d; margin-bottom: 15px; font-weight: bold; letter-spacing: 2px;">${getInitials(p.name, p.email)}</div>`;
            const avatarHtml = p.avatar_url 
                ? `<img src="${p.avatar_url}" onerror="this.outerHTML=decodeURIComponent('${encodeURIComponent(fallbackHtml)}')" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 15px; border: 2px solid var(--primary-color);">`
                : fallbackHtml;

            // Calculate exact ratings or use default
            const ratingWorker = p.rating_as_worker ? p.rating_as_worker.toFixed(1) : '—';
            const ratingClient = p.rating_as_client ? p.rating_as_client.toFixed(1) : '—';

            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 0 auto; text-align: center;">
                    ${avatarHtml}
                    <h2 style="margin: 0 0 5px 0;">${p.name || 'Пользователь не указал имя'}</h2>
                    <h4 style="margin: 0 0 15px 0; color: #7f8c8d; font-weight: normal;">${p.title || 'Специальность не указана'}</h4>
                    <p style="color: #95a5a6; font-size: 0.9rem; margin-bottom: 20px;">${p.email}</p>
                    
                    <div style="display: flex; justify-content: center; gap: 30px; margin-bottom: 25px; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 15px 0;">
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${ratingWorker}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase;">Рейтинг Исполнителя</div>
                        </div>
                        <div>
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--secondary-color);">${ratingClient}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase;">Рейтинг Заказчика</div>
                        </div>
                    </div>

                    <div style="text-align: left; margin-bottom: 30px;">
                        <h3 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">О себе</h3>
                        <p style="white-space: pre-wrap; color: #2c3e50; line-height: 1.6;">${p.bio || 'Пользователь еще не заполнил информацию о себе.'}</p>
                        ${p.portfolio_url ? `<p style="margin-top: 10px;"><a href="${p.portfolio_url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none; font-size: 0.95rem;">🔗 Портфолио / Сайт</a></p>` : ''}
                    </div>
                    
                    <div style="text-align: left; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">
                            <h3 style="margin: 0;">Отзывы (${window.profileState.reviews ? window.profileState.reviews.length : 0})</h3>
                            ${!isOwnProfile ? `
                                <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #2c3e50; border-color: #2c3e50;" onclick="window.toggleReviewForm()">⭐ Оставить отзыв</button>
                            ` : ''}
                        </div>
                        
                        ${!isOwnProfile ? `
                        <div id="inline-review-form-profile" style="display: none; margin-bottom: 20px; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                            <h4 style="margin: 0 0 10px 0;">Ваш отзыв</h4>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Оценка</label>
                                <select id="review-rating-select" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                    <option value="5">⭐⭐⭐⭐⭐ (5) Отлично</option>
                                    <option value="4">⭐⭐⭐⭐ (4) Хорошо</option>
                                    <option value="3">⭐⭐⭐ (3) Нормально</option>
                                    <option value="2">⭐⭐ (2) Плохо</option>
                                    <option value="1">⭐ (1) Ужасно</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Комментарий</label>
                                <textarea id="review-text-input" rows="3" placeholder="Расскажите о вашем опыте работы с этим пользователем..." style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                <button onclick="window.toggleReviewForm()" class="btn btn-outline" style="padding: 8px 15px;">Отмена</button>
                                <button onclick="window.submitProfileReview('${p.user_id}')" class="btn btn-primary" style="padding: 8px 15px;">Опубликовать</button>
                            </div>
                        </div>
                        ` : ''}

                        <div id="profile-reviews-list">
                            ${(!window.profileState.reviews || window.profileState.reviews.length === 0) 
                                ? '<p style="color: #95a5a6; font-style: italic;">У этого пользователя пока нет отзывов.</p>' 
                                : window.profileState.reviews.map(review => `
                                    <div class="review-card" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;">
                                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                            <strong style="color: var(--text-color);">${review.reviewer?.name || 'Пользователь'}</strong>
                                            <span style="color: #f39c12; font-size: 0.9rem;">${'⭐'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                                        </div>
                                        <div style="font-size: 0.8rem; color: #95a5a6; margin-bottom: 8px;">
                                            ${new Date(review.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                        <p style="margin: 0; line-height: 1.5; color: #34495e; white-space: pre-wrap; font-size: 0.95rem;">${review.comment}</p>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>

                    ${isOwnProfile 
                        ? `<button class="btn btn-primary" onclick="window.toggleProfileEdit()" style="width: 100%;">Редактировать профиль</button>` 
                        : (window.auth.isLoggedIn() ? `
                            <button class="btn btn-primary" onclick="window.toggleProfileMessageForm()" style="width: 100%;">✉️ Написать сообщение</button>
                            <div id="inline-msg-form-profile" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; text-align: left;">
                                <h4 style="margin: 0 0 10px 0;">Новое сообщение</h4>
                                <textarea id="inline-msg-text-profile" rows="4" placeholder="Введите ваше сообщение..." style="width: 100%; margin-bottom: 15px; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                    <button onclick="window.toggleProfileMessageForm()" class="btn btn-outline" style="padding: 8px 15px;">Отмена</button>
                                    <button onclick="window.sendProfileMessage('${p.user_id}')" class="btn btn-primary" style="padding: 8px 15px;">Отправить</button>
                                </div>
                            </div>
                        ` : '')
                    }
                </div>
            `;
        }
    };

    // Global toggle and send handlers for review form
    window.toggleReviewForm = function() {
        const formEl = document.getElementById('inline-review-form-profile');
        if (formEl) {
            formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.submitProfileReview = async function(targetUserId) {
        // Auth check at submit time
        if (!window.auth.isLoggedIn()) {
            window.utils.showToast('Войдите в систему, чтобы оставить отзыв', 'warning');
            document.getElementById('loginModal').classList.add('active');
            return;
        }

        const ratingEl = document.getElementById('review-rating-select');
        const textEl = document.getElementById('review-text-input');
        
        const rating = parseInt(ratingEl.value, 10);
        const comment = textEl.value.trim();

        if (isNaN(rating) || rating < 1 || rating > 5) {
            window.utils.showToast('Выберите рейтинг от 1 до 5', 'warning');
            return;
        }

        if (comment.length < 5) {
            window.utils.showToast('Отзыв слишком короткий (минимум 5 символов)', 'warning');
            return;
        }

        try {
            const btn = document.querySelector('#inline-review-form-profile .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Отправка...';
            }

            await window.api.submitProfileReview(targetUserId, rating, comment);
            window.utils.showToast('Отзыв успешно добавлен!', 'success');
            
            // Reload profile data (including reviews)
            const resp = await window.api.request(`/users/${targetUserId}`, { method: 'GET' });
            window.profileState.data = resp.data || resp;
            
            const reviewsResp = await window.api.getProfileReviews(targetUserId);
            window.profileState.reviews = reviewsResp.data || reviewsResp;
            
            window.renderProfileView();
        } catch (error) {
            console.error('Error submitting review:', error);
            window.utils.showToast(error.message || 'Ошибка при отправке отзыва', 'error');
            const btn = document.querySelector('#inline-review-form-profile .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Оставить отзыв';
            }
        }
    };

    // Global toggle and send handlers for profile message form
    window.toggleProfileMessageForm = function() {
        const formEl = document.getElementById('inline-msg-form-profile');
        if (formEl) {
            formEl.style.display = formEl.style.display === 'none' ? 'block' : 'none';
        }
    };

    window.sendProfileMessage = async function(receiverId) {
        const textEl = document.getElementById('inline-msg-text-profile');
        const message = textEl ? textEl.value.trim() : '';

        if (!message) {
            window.utils.showToast('Введите текст сообщения', 'warning');
            return;
        }

        try {
            const btn = document.querySelector('#inline-msg-form-profile .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.textContent = 'Отправка...';
            }

            await window.api.sendMessage(receiverId, message);
            window.utils.showToast('Сообщение отправлено!', 'success');
            
            // Clear and hide form
            textEl.value = '';
            window.toggleProfileMessageForm();
            
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Отправить';
            }
        } catch (error) {
            console.error('Error sending profile message:', error);
            window.utils.showToast(error.message || 'Ошибка при отправке', 'error');
            const btn = document.querySelector('#inline-msg-form-profile .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.textContent = 'Отправить';
            }
        }
    };

    // Trigger initial fetch when component mounts
    setTimeout(async () => {
        const container = document.getElementById('profile-content-container');
        if (!container) return;
        
        try {
            const endpoint = userId === 'me' ? '/users/me' : `/users/${userId}`;
            const resp = await window.api.request(endpoint, { method: 'GET' });
            window.profileState.data = resp.data || resp;
            
            // Fetch reviews
            const targetId = userId === 'me' ? window.profileState.data.user_id : userId;
            const reviewsResp = await window.api.getProfileReviews(targetId);
            window.profileState.reviews = reviewsResp.data || reviewsResp || [];
            
            window.renderProfileView();
        } catch (e) {
            container.innerHTML = `<div class="error" style="text-align: center;">Ошибка загрузки профиля: ${e.message}</div>`;
        }
    }, 50);

    return `
        <div class="profile-page" style="padding: 20px;">
            <div id="profile-content-container">
                <div style="text-align: center; padding: 50px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: #7f8c8d;">Загрузка профиля...</p>
                </div>
            </div>
        </div>
    `;
});
