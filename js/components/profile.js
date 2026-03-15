// Profile component
window.router.register('profile', async function(props) {
    const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    const userId = props?.id || 'me';
    const isOwnProfile = userId === 'me';

    if (isOwnProfile && !window.auth.isLoggedIn()) {
        return window.utils.renderAuthRequired(tr('profile.authToEdit'));
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
        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        btn.disabled = true;
        btn.textContent = tr('profile.saving');

        try {
            const currencyVal = document.getElementById('edit-profile-currency').value;
            if (window.currencyService) {
                window.currencyService.setPreferredCurrency(currencyVal);
            }

            const hourlyRateInput = document.getElementById('edit-profile-hourly-rate').value.trim();
            const hourlyRate = hourlyRateInput ? parseFloat(hourlyRateInput) : null;
            if (hourlyRateInput && (isNaN(hourlyRate) || hourlyRate < 0)) {
                window.utils.showToast(tr('profile.hourlyRatePositive'), 'warning');
                btn.disabled = false;
                btn.textContent = tr('profile.save');
                return;
            }

            // Parse specializations from comma-separated string
            const specializationsInput = document.getElementById('edit-profile-specializations').value.trim();
            const specializations = specializationsInput 
                ? specializationsInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
                : [];

            const updates = {
                name: document.getElementById('edit-profile-name').value.trim(),
                title: document.getElementById('edit-profile-title').value.trim(),
                bio: document.getElementById('edit-profile-bio').value.trim(),
                portfolio_url: document.getElementById('edit-profile-portfolio').value.trim(),
                telegram_url: document.getElementById('edit-profile-telegram').value.trim(),
                hourly_rate: hourlyRate,
                specializations: specializations
            };

            const response = await window.api.request('/users/me', {
                method: 'PUT',
                body: JSON.stringify({ data: updates })
            });

            window.profileState.data = response.data || response;
            window.profileState.isEditing = false;
            window.utils.showToast(tr('profile.updated'), 'success');
            window.renderProfileView();
        } catch (error) {
            window.utils.showToast(error.message || tr('profile.updateError'), 'error');
            btn.disabled = false;
            btn.textContent = tr('profile.save');
        }
    };

    window.changePassword = async function() {
        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        const oldPass = document.getElementById('edit-profile-old-password').value;
        const newPass = document.getElementById('edit-profile-new-password').value;
        const confPass = document.getElementById('edit-profile-confirm-password').value;
        if (!oldPass || !newPass || !confPass) {
            window.utils.showToast(tr('profile.fillPasswordFields'), 'warning');
            return;
        }
        if (newPass !== confPass) {
            window.utils.showToast(tr('profile.passwordsMismatch'), 'error');
            return;
        }
        if (newPass.length < 6) {
            window.utils.showToast(tr('profile.passwordMinLength'), 'warning');
            return;
        }
        const btn = document.getElementById('changePasswordBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = tr('profile.processing');
        }
        try {
            const resp = await window.api.changePassword(oldPass, newPass);
            window.utils.showToast(resp.message || tr('profile.passwordChanged'), 'success');
            document.getElementById('edit-profile-old-password').value = '';
            document.getElementById('edit-profile-new-password').value = '';
            document.getElementById('edit-profile-confirm-password').value = '';
        } catch (error) {
            window.utils.showToast(error.message || tr('profile.passwordError'), 'error');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.textContent = tr('profile.changePasswordBtn');
            }
        }
    };

    window.renderProfileView = () => {
        const container = document.getElementById('profile-content-container');
        if (!container) return;

        const p = window.profileState.data;
        const isEdit = window.profileState.isEditing;

        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        if (isEdit) {
            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                        <h2 style="margin: 0;">${tr('profile.editTitle')}</h2>
                        <button class="btn btn-outline" onclick="window.toggleProfileEdit()">${tr('profile.cancel')}</button>
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-name">${tr('profile.nameLabel')}</label>
                        <input type="text" id="edit-profile-name" value="${p.name || ''}" placeholder="${tr('profile.namePlaceholder')}" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-title">${tr('profile.titleLabel')}</label>
                        <input type="text" id="edit-profile-title" value="${p.title || ''}" placeholder="${tr('profile.titlePlaceholder')}" maxlength="100">
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-specializations">${tr('profile.specializationsLabel')}</label>
                        <input type="text" id="edit-profile-specializations" value="${(p.specializations && Array.isArray(p.specializations) ? p.specializations.join(', ') : '') || ''}" placeholder="JavaScript, React, Node.js" maxlength="500">
                        <small style="color: #7f8c8d; font-size: 0.85rem;">${tr('profile.specializationsHint')}</small>
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-bio">${tr('profile.bioLabel')}</label>
                        <textarea id="edit-profile-bio" rows="6" placeholder="${tr('profile.bioPlaceholder')}" maxlength="1000">${p.bio || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-portfolio">${tr('profile.portfolioLabel')}</label>
                        <input type="url" id="edit-profile-portfolio" value="${p.portfolio_url || ''}" placeholder="${tr('profile.portfolioPlaceholder')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-telegram">${tr('profile.telegramLabel')}</label>
                        <input type="url" id="edit-profile-telegram" value="${p.telegram_url || ''}" placeholder="${tr('profile.telegramPlaceholder')}">
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-hourly-rate">${tr('profile.hourlyRateLabel')}</label>
                        <input type="number" id="edit-profile-hourly-rate" value="${p.hourly_rate || ''}" placeholder="1000" min="0" step="100">
                        <small style="color: #7f8c8d; font-size: 0.85rem;">${tr('profile.hourlyRateHint')}</small>
                    </div>
                    <div class="form-group">
                        <label for="edit-profile-currency" style="display: block; margin-bottom: 5px;">${tr('profile.currencyLabel')}</label>
                        <select id="edit-profile-currency" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                            <option value="RUB" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'RUB' ? 'selected' : ''}>₽ RUB</option>
                            <option value="USD" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'USD' ? 'selected' : ''}>$ USD</option>
                            <option value="EUR" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'EUR' ? 'selected' : ''}>€ EUR</option>
                            <option value="UAH" ${window.currencyService && window.currencyService.getPreferredCurrency() === 'UAH' ? 'selected' : ''}>₴ UAH</option>
                        </select>
                    </div>
                    <button id="saveProfileBtn" class="btn btn-primary" style="width: 100%; margin-top: 15px;" onclick="window.saveProfile()">${tr('profile.save')}</button>
                    <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
                        <h3 style="margin-top: 0; margin-bottom: 15px;">${tr('profile.changePasswordTitle')}</h3>
                        <div class="form-group">
                            <label for="edit-profile-old-password">${tr('auth.password')}</label>
                            <input type="password" id="edit-profile-old-password" placeholder="">
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-new-password">${tr('auth.password')}</label>
                            <input type="password" id="edit-profile-new-password" placeholder="">
                        </div>
                        <div class="form-group">
                            <label for="edit-profile-confirm-password">${tr('auth.confirmPassword')}</label>
                            <input type="password" id="edit-profile-confirm-password" placeholder="">
                        </div>
                        <button id="changePasswordBtn" class="btn btn-outline" style="width: 100%;" onclick="window.changePassword()">${tr('profile.changePasswordBtn')}</button>
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

            const currentUser = window.auth.getCurrentUser();
            const currentUserId = currentUser ? currentUser.user_id : null;

            const locale = document.documentElement.lang || 'ru';
            container.innerHTML = `
                <div class="card" style="max-width: 600px; margin: 0 auto; text-align: center;">
                    ${avatarHtml}
                    <h2 style="margin: 0 0 5px 0;">${p.name || p.email || tr('profile.noName')}</h2>
                    <h4 style="margin: 0 0 10px 0; color: #7f8c8d; font-weight: normal;">${p.title || tr('profile.noTitle')}</h4>
                    ${p.specializations && Array.isArray(p.specializations) && p.specializations.length > 0 ? `
                        <div style="margin-bottom: 15px;">
                            <p style="color: #7f8c8d; font-size: 0.85rem; margin-bottom: 5px; font-weight: 500;">${tr('profile.specializationsTitle')}:</p>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                                ${p.specializations.map(spec => `<span style="background: var(--primary-color); color: white; padding: 4px 12px; border-radius: 15px; font-size: 0.85rem;">${spec}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    <p style="color: #95a5a6; font-size: 0.9rem; margin-bottom: 20px;">${p.email}</p>
                    
                    <div style="display: flex; margin-bottom: 25px; border-top: 1px solid #f0f0f0; border-bottom: 1px solid #f0f0f0; padding: 15px 0;">
                        <div style="flex: 0 0 33.333%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary-color);">${ratingWorker}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase;">${tr('profile.ratingWorker')}</div>
                        </div>
                        <div style="flex: 0 0 33.333%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold; color: var(--secondary-color);">${ratingClient}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase;">${tr('profile.ratingClient')}</div>
                        </div>
                        <div style="flex: 0 0 33.333%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;">
                            ${p.hourly_rate ? `
                            <div style="font-size: 1.5rem; font-weight: bold; color: #27ae60;">${window.utils.formatCurrency ? window.utils.formatCurrency(p.hourly_rate) : p.hourly_rate.toLocaleString(locale) + ' ₽'}</div>
                            <div style="font-size: 0.8rem; color: #7f8c8d; text-transform: uppercase;">${tr('profile.perHour')}</div>
                            ` : '—'}
                        </div>
                    </div>

                    <div style="text-align: left; margin-bottom: 30px;">
                        <h3 style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">${tr('profile.aboutTitle')}</h3>
                        <p style="white-space: pre-wrap; color: #2c3e50; line-height: 1.6;">${p.bio || tr('profile.noBio')}</p>
                        ${p.portfolio_url ? `<p style="margin-top: 10px;"><a href="${p.portfolio_url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none; font-size: 0.95rem;">🔗 ${tr('profile.portfolioLink')}</a></p>` : ''}
                        ${p.telegram_url ? `<p style="margin-top: 8px;"><a href="${p.telegram_url}" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none; font-size: 0.95rem;">📱 ${tr('profile.telegramLink')}</a></p>` : ''}
                    </div>
                    <div style="text-align: left; margin-bottom: 30px;">
                        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px;">
                            <h3 style="margin: 0;">${tr('profile.reviewsTitle')} (${window.profileState.reviews ? window.profileState.reviews.length : 0})</h3>
                            ${!isOwnProfile && window.profileState.canReview ? `
                                <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #2c3e50; border-color: #2c3e50;" onclick="window.toggleReviewForm()">⭐ ${tr('profile.leaveReview')}</button>
                            ` : !isOwnProfile && window.profileState.reviewReason ? `
                                <span style="font-size: 0.85rem; color: #7f8c8d; font-style: italic;">${window.profileState.reviewReason}</span>
                            ` : ''}
                        </div>
                        
                        ${!isOwnProfile && window.profileState.canReview ? `
                        <div id="inline-review-form-profile" style="display: none; margin-bottom: 20px; padding: 15px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                            <h4 style="margin: 0 0 10px 0;">${tr('profile.yourReview')}</h4>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">${tr('profile.ratingLabel')}</label>
                                <select id="review-rating-select" class="form-control" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                    <option value="5">⭐⭐⭐⭐⭐ (5) ${tr('profile.rating5')}</option>
                                    <option value="4">⭐⭐⭐⭐ (4) ${tr('profile.rating4')}</option>
                                    <option value="3">⭐⭐⭐ (3) ${tr('profile.rating3')}</option>
                                    <option value="2">⭐⭐ (2) ${tr('profile.rating2')}</option>
                                    <option value="1">⭐ (1) ${tr('profile.rating1')}</option>
                                </select>
                            </div>
                            <div style="margin-bottom: 10px;">
                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">${tr('profile.commentLabel')}</label>
                                <textarea id="review-text-input" rows="3" placeholder="${tr('profile.commentPlaceholder')}" style="width: 100%; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                            </div>
                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                <button onclick="window.toggleReviewForm()" class="btn btn-outline" style="padding: 8px 15px;">${tr('profile.cancel')}</button>
                                <button onclick="window.submitProfileReview('${p.user_id}')" class="btn btn-primary" style="padding: 8px 15px;">${tr('profile.publish')}</button>
                            </div>
                        </div>
                        ` : ''}
                        <div id="profile-reviews-list">
                            ${(!window.profileState.reviews || window.profileState.reviews.length === 0) 
                                ? '<p style="color: #95a5a6; font-style: italic;">' + tr('profile.noReviews') + '</p>' 
                                : window.profileState.reviews.map(review => {
                                    const isMyReview = currentUserId && review.reviewer_id === currentUserId;
                                    return `
                                    <div class="review-card" id="review-card-${review.review_id}" data-review-id="${review.review_id}" data-target-user-id="${p.user_id}" data-rating="${review.rating}" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #f0f0f0;">
                                        <div class="review-card-static">
                                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                                <div>
                                                    <strong style="color: var(--text-color);">${review.reviewer?.name || tr('profile.reviewer')}</strong>
                                                    <span style="color: #f39c12; font-size: 0.9rem; margin-left: 8px;">${'⭐'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span>
                                                </div>
                                                ${isMyReview ? `<button type="button" class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #2c3e50; border-color: #2c3e50;" onclick="window.startEditReview('${review.review_id}')">${tr('profile.editReview')}</button>` : ''}
                                            </div>
                                            <div style="font-size: 0.8rem; color: #95a5a6; margin-bottom: 8px;">
                                                ${new Date(review.created_at).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </div>
                                            <p id="review-comment-${review.review_id}" style="margin: 0; line-height: 1.5; color: #34495e; white-space: pre-wrap; font-size: 0.95rem;">${review.comment}</p>
                                        </div>
                                        ${isMyReview ? `
                                        <div id="review-edit-form-${review.review_id}" style="display: none; margin-top: 10px; padding: 12px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                                            <div style="margin-bottom: 10px;">
                                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">${tr('profile.ratingLabel')}</label>
                                                <select id="review-edit-rating-${review.review_id}" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px;">
                                                    <option value="5" ${review.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
                                                    <option value="4" ${review.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
                                                    <option value="3" ${review.rating === 3 ? 'selected' : ''}>⭐⭐⭐ (3)</option>
                                                    <option value="2" ${review.rating === 2 ? 'selected' : ''}>⭐⭐ (2)</option>
                                                    <option value="1" ${review.rating === 1 ? 'selected' : ''}>⭐ (1)</option>
                                                </select>
                                            </div>
                                            <div style="margin-bottom: 10px;">
                                                <label style="display: block; margin-bottom: 5px; font-weight: bold;">${tr('profile.commentLabel')}</label>
                                                <textarea id="review-edit-comment-${review.review_id}" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                            </div>
                                            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                                <button type="button" onclick="window.cancelEditReview('${review.review_id}')" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.9rem;">${tr('profile.cancel')}</button>
                                                <button type="button" onclick="window.saveEditReview('${review.review_id}')" class="btn btn-primary" style="padding: 6px 12px; font-size: 0.9rem;">${tr('profile.save')}</button>
                                            </div>
                                        </div>
                                        ` : ''}
                                    </div>
                                `;
                                }).join('')
                            }
                        </div>
                    </div>
                    ${isOwnProfile 
                        ? `<button class="btn btn-primary" onclick="window.toggleProfileEdit()" style="width: 100%;">${tr('profile.editProfile')}</button>` 
                        : (window.auth.isLoggedIn() ? `
                            <button class="btn btn-primary" onclick="window.toggleProfileMessageForm()" style="width: 100%;">✉️ ${tr('profile.writeMessage')}</button>
                            <div id="inline-msg-form-profile" style="display: none; margin-top: 15px; padding: 15px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; text-align: left;">
                                <h4 style="margin: 0 0 10px 0;">${tr('profile.newMessage')}</h4>
                                <textarea id="inline-msg-text-profile" rows="4" placeholder="${tr('profile.messagePlaceholder')}" style="width: 100%; margin-bottom: 15px; padding: 10px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                                    <button onclick="window.toggleProfileMessageForm()" class="btn btn-outline" style="padding: 8px 15px;">${tr('profile.cancel')}</button>
                                    <button onclick="window.sendProfileMessage('${p.user_id}')" class="btn btn-primary" style="padding: 8px 15px;">${tr('profile.send')}</button>
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

    window.startEditReview = function(reviewId) {
        const card = document.getElementById('review-card-' + reviewId);
        if (!card) return;
        const staticBlock = card.querySelector('.review-card-static');
        const formEl = document.getElementById('review-edit-form-' + reviewId);
        const commentEl = document.getElementById('review-comment-' + reviewId);
        const ratingSelect = document.getElementById('review-edit-rating-' + reviewId);
        const commentTextarea = document.getElementById('review-edit-comment-' + reviewId);
        if (!staticBlock || !formEl || !commentTextarea || !ratingSelect) return;
        ratingSelect.value = card.getAttribute('data-rating') || '5';
        commentTextarea.value = commentEl ? commentEl.textContent : '';
        staticBlock.style.display = 'none';
        formEl.style.display = 'block';
    };

    window.cancelEditReview = function(reviewId) {
        const card = document.getElementById('review-card-' + reviewId);
        if (!card) return;
        const staticBlock = card.querySelector('.review-card-static');
        const formEl = document.getElementById('review-edit-form-' + reviewId);
        if (staticBlock) staticBlock.style.display = '';
        if (formEl) formEl.style.display = 'none';
    };

    window.saveEditReview = async function(reviewId) {
        const card = document.getElementById('review-card-' + reviewId);
        if (!card) return;
        const targetUserId = card.getAttribute('data-target-user-id');
        const ratingEl = document.getElementById('review-edit-rating-' + reviewId);
        const commentEl = document.getElementById('review-edit-comment-' + reviewId);
        if (!targetUserId || !ratingEl || !commentEl) return;
        const rating = parseInt(ratingEl.value, 10);
        const comment = commentEl.value.trim();
        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        if (isNaN(rating) || rating < 1 || rating > 5) {
            window.utils.showToast(tr('profile.rating1to5'), 'warning');
            return;
        }
        if (comment.length < 5) {
            window.utils.showToast(tr('profile.commentTooShort'), 'warning');
            return;
        }
        try {
            await window.api.updateProfileReview(targetUserId, reviewId, rating, comment);
            window.utils.showToast(tr('profile.reviewUpdated'), 'success');
            if (window.profileState && window.profileState.data) {
                const uid = window.profileState.data.user_id;
                const reviewsResp = await window.api.getProfileReviews(uid);
                window.profileState.reviews = reviewsResp.data || reviewsResp;
                window.renderProfileView();
            }
        } catch (error) {
            console.error('Error updating review:', error);
            window.utils.showToast(error.message || tr('profile.reviewSaveError'), 'error');
        }
    };

    window.submitProfileReview = async function(targetUserId) {
        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        if (!window.auth.isLoggedIn()) {
            window.utils.showToast(tr('users.loginToReview'), 'warning');
            window.auth.openLoginModal();
            return;
        }

        const ratingEl = document.getElementById('review-rating-select');
        const textEl = document.getElementById('review-text-input');
        
        const rating = parseInt(ratingEl.value, 10);
        const comment = textEl.value.trim();

        if (isNaN(rating) || rating < 1 || rating > 5) {
            window.utils.showToast(tr('profile.rating1to5'), 'warning');
            return;
        }
        if (comment.length < 5) {
            window.utils.showToast(tr('profile.commentTooShort'), 'warning');
            return;
        }
        try {
            const btn = document.querySelector('#inline-review-form-profile .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.textContent = tr('auth.sending');
            }
            await window.api.submitProfileReview(targetUserId, rating, comment);
            window.utils.showToast(tr('users.reviewSent'), 'success');
            
            // Reload profile data (including reviews)
            const resp = await window.api.request(`/users/${targetUserId}`, { method: 'GET' });
            window.profileState.data = resp.data || resp;
            
            const reviewsResp = await window.api.getProfileReviews(targetUserId);
            window.profileState.reviews = reviewsResp.data || reviewsResp;
            
            window.renderProfileView();
        } catch (error) {
            console.error('Error submitting review:', error);
            window.utils.showToast(error.message || tr('users.reviewError'), 'error');
            const btn = document.querySelector('#inline-review-form-profile .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.textContent = tr('profile.leaveReview');
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

        const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
        if (!message) {
            window.utils.showToast(tr('messages.enterText'), 'warning');
            return;
        }
        try {
            const btn = document.querySelector('#inline-msg-form-profile .btn-primary');
            if (btn) {
                btn.disabled = true;
                btn.textContent = tr('auth.sending');
            }
            await window.api.sendMessage(receiverId, message);
            window.utils.showToast(tr('profile.messageSent'), 'success');
            textEl.value = '';
            window.toggleProfileMessageForm();
            if (btn) {
                btn.disabled = false;
                btn.textContent = tr('profile.send');
            }
        } catch (error) {
            console.error('Error sending profile message:', error);
            window.utils.showToast(error.message || tr('profile.sendError'), 'error');
            const btn = document.querySelector('#inline-msg-form-profile .btn-primary');
            if (btn) {
                btn.disabled = false;
                btn.textContent = tr('profile.send');
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
            
            // Check if current user can review this profile
            if (!isOwnProfile && window.auth.isLoggedIn()) {
                try {
                    const canReviewResp = await window.api.canReviewUser(targetId);
                    window.profileState.canReview = (canReviewResp.data || canReviewResp).canReview || false;
                    window.profileState.reviewReason = (canReviewResp.data || canReviewResp).reason || null;
                } catch (e) {
                    console.error('[Profile] Error checking review eligibility:', e);
                    window.profileState.canReview = false;
                }
            } else {
                window.profileState.canReview = false;
            }
            
            window.renderProfileView();
        } catch (e) {
            const tr = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
            container.innerHTML = '<div class="error" style="text-align: center;">' + tr('profile.loadError') + ': ' + e.message + '</div>';
        }
    }, 50);

    const trInit = window.i18n && window.i18n.t ? window.i18n.t.bind(window.i18n) : (k) => k;
    return `
        <div class="profile-page" style="padding: 20px;">
            <div id="profile-content-container">
                <div style="text-align: center; padding: 50px;">
                    <div class="spinner"></div>
                    <p style="margin-top: 15px; color: #7f8c8d;">${trInit('profile.loading')}</p>
                </div>
            </div>
        </div>
    `;
});
