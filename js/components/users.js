// Users Component
function tr(key) { return window.i18n && window.i18n.t ? window.i18n.t(key) : key; }

window.makeAdmin = async (userId) => {
    if (!confirm(tr('users.confirmMakeAdmin'))) return;
    try {
        await window.api.updateUserRole(userId, 'ADMIN');
        window.utils.showToast(tr('users.roleUpdated'), 'success');
        window.router.navigate('users');
    } catch (error) {
        window.utils.showToast(error.message, 'error');
    }
};

window.banUser = async (userId) => {
    if (!confirm(tr('users.confirmBan'))) return;
    try {
        await window.api.updateUserStatus(userId, 'BANNED');
        window.utils.showToast(tr('users.userBanned'), 'success');
        window.router.navigate('users');
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
        window.utils.showToast(tr('users.loginToReview'), 'warning');
        window.auth.openLoginModal();
        return;
    }
    try {
        const canReviewResp = await window.api.canReviewUser(userId);
        const canReview = (canReviewResp.data || canReviewResp).canReview;
        if (!canReview) {
            const reason = (canReviewResp.data || canReviewResp).reason || tr('users.cannotReview');
            window.utils.showToast(reason, 'warning');
            return;
        }
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        window.utils.showToast(tr('users.reviewError'), 'error');
        return;
    }
    const ratingEl = document.getElementById('user-review-rating-' + userId);
    const textEl   = document.getElementById('user-review-text-'   + userId);
    const rating  = parseInt(ratingEl ? ratingEl.value : '5', 10);
    const comment = textEl ? textEl.value.trim() : '';
    if (comment.length < 5) {
        window.utils.showToast(tr('users.reviewTooShort'), 'warning');
        return;
    }
    const btn = document.querySelector('#user-review-form-' + userId + ' .btn-primary');
    try {
        if (btn) { btn.disabled = true; btn.textContent = (window.i18n && window.i18n.t ? window.i18n.t('auth.sending') : 'Отправка...'); }
        await window.api.submitProfileReview(userId, rating, comment);
        window.utils.showToast(tr('users.reviewSent'), 'success');
        if (textEl) textEl.value = '';
        window.toggleUserReviewForm(userId);
        window.router.navigate('users', {}, { force: true });
    } catch (error) {
        console.error('Error submitting user review:', error);
        const errorMsg = error.message || tr('users.reviewError');
        if (errorMsg.includes('accepting their application')) {
            window.utils.showToast(tr('users.reviewAfterAccept'), 'warning');
        } else {
            window.utils.showToast(errorMsg, 'error');
        }
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = tr('users.publish'); }
    }
};

window.router.register('users', async () => {
    if (!window.auth.isLoggedIn()) {
        return window.utils.renderAuthRequired(tr('common.authRequired'));
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
        // Build filters object from URL params
        const filters = {};
        if (currentSpecializationFilter) {
            filters.specialization = currentSpecializationFilter;
        }
        if (currentSortBy) {
            filters.sortBy = currentSortBy;
            filters.sortOrder = currentSortOrder;
        }

        // Load users and specializations in parallel so a slow/timeout on one doesn't block the list
        let specializationsList = [];
        const [specsResult, usersResult] = await Promise.all([
            window.api.getSpecializations().then(r => (r.data || r).specializations || []).catch(err => {
                console.error('[Users] Error loading specializations:', err);
                return [];
            }),
            window.api.getUsers(filters).then(r => r.data || r).catch(err => {
                throw err;
            })
        ]);
        specializationsList = Array.isArray(specsResult) ? specsResult : [];
        const users = Array.isArray(usersResult) ? usersResult : [];

        // Determine if current user is admin and get their ID
        let isAdmin = false;
        let currentUserId = null;
        const payload = window.auth.getJwtPayload();
        if (payload) {
            isAdmin = payload.role === 'ADMIN';
            currentUserId = payload.userId;
        }

        if (users.length === 0) {
            return `
                <div class="users-container">
                    <h2>${tr('users.pageTitle')}</h2>
                    <p>${tr('users.noUsersYet')}</p>
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
                roleText = tr('users.roleAdmin');
                roleClass = 'admin';
            } else if (user.role === 'client') {
                roleText = tr('users.roleClient');
            }

            const isBanned = user.status === 'BANNED';
            const banBadge = isBanned ? '<span class="badge error">' + tr('users.bannedBadge') + '</span>' : '';
            const displayName = (user.name || tr('users.noName')).replace(/'/g, "\\'");

            let actionButtons = `
                <div class="user-card-actions">
                <button type="button" data-profile-id="${user.user_id}" class="btn btn-secondary btn-profile-link" style="font-size: 0.8rem; padding: 5px 10px;">
                    ${tr('users.more')}
                </button>
            `;

            const isOtherUser = currentUserId && currentUserId !== user.user_id && !isBanned;

            if (isOtherUser) {
                actionButtons += `
                    <button onclick="window.router.navigate('messages'); setTimeout(() => window.showReplyBox('${user.user_id}', '${displayName}'), 100);" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 10px;">
                        ✉️ ${tr('users.writeMessage')}
                    </button>
                `;
            }

            // Review button and inline form - only show if user can review
            const canReview = reviewEligibilityMap[user.user_id] || false;
            if (isOtherUser && canReview) {
                actionButtons += `
                    <button onclick="window.toggleUserReviewForm('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; color: #2c3e50; border-color: #2c3e50;">
                        ⭐ ${tr('users.reviewBtn')}
                    </button>
                `;
            }
            const reviewFormHtml = (isOtherUser && canReview) ? `
                <div id="user-review-form-${user.user_id}" style="display: none; margin-top: 12px; padding: 12px; border: 1px solid #f39c12; border-radius: 8px; background: #fffdf5;">
                    <strong style="display: block; margin-bottom: 8px; font-size: 0.9rem;">${tr('users.leaveReviewTitle')}</strong>
                    <select id="user-review-rating-${user.user_id}" style="width: 100%; padding: 6px; border: 1px solid #ced4da; border-radius: 4px; margin-bottom: 8px; font-family: inherit;">
                        <option value="5">⭐⭐⭐⭐⭐ (5) ${tr('profile.rating5')}</option>
                        <option value="4">⭐⭐⭐⭐ (4) ${tr('profile.rating4')}</option>
                        <option value="3">⭐⭐⭐ (3) ${tr('profile.rating3')}</option>
                        <option value="2">⭐⭐ (2) ${tr('profile.rating2')}</option>
                        <option value="1">⭐ (1) ${tr('profile.rating1')}</option>
                    </select>
                    <textarea id="user-review-text-${user.user_id}" rows="3" placeholder="${tr('users.reviewPlaceholder')}" style="width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 4px; font-family: inherit; resize: vertical; margin-bottom: 8px;"></textarea>
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="window.toggleUserReviewForm('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 12px; color: #2c3e50; border-color: #2c3e50;">${tr('users.cancel')}</button>
                        <button onclick="window.submitUserReview('${user.user_id}')" class="btn btn-primary" style="font-size: 0.8rem; padding: 5px 12px;">${tr('users.publish')}</button>
                    </div>
                </div>
            ` : '';

            if (isAdmin) {
                actionButtons += `</div><div class="admin-controls" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border-color); display: flex; gap: 10px;">
                        ${user.role !== 'ADMIN' ? `<button onclick="window.makeAdmin('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; color: #2c3e50; border-color: #2c3e50;">${tr('users.makeAdmin')}</button>` : ''}
                        ${!isBanned ? `<button onclick="window.banUser('${user.user_id}')" class="btn btn-outline" style="font-size: 0.8rem; padding: 5px 10px; border-color: var(--error-color); color: var(--error-color);">${tr('users.banUser')}</button>` : ''}
                    </div>`;
            } else {
                actionButtons += `</div>`;
            }

            const perHourText = tr('users.perHour');
            usersHtml += `
                <div class="user-card card ${isBanned ? 'banned' : ''}" style="${isBanned ? 'opacity: 0.6;' : ''}">
                    <div class="user-header">
                        <h3>${user.name || tr('users.noName')} <span class="badge ${roleClass}">${roleText}</span> ${banBadge}</h3>
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
                                <span class="stat-label">${tr('users.ratingClientLabel')}</span>
                                <span class="stat-val">${user.rating_as_client ? user.rating_as_client.toFixed(1) : '—'}</span>
                            </div>
                            <div class="stat">
                                <span class="stat-label">${tr('users.ratingWorkerLabel')}</span>
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
											${user.hourly_rate ? `<p class="user-header-rate" style="color: #27ae60; font-weight: 500; margin-top: 5px; margin-bottom: 0; font-size: 0.9rem;">💰 ${window.utils.formatCurrency ? window.utils.formatCurrency(user.hourly_rate) + ' ' + perHourText : user.hourly_rate.toLocaleString('ru-RU') + ' ₽ ' + perHourText}</p>` : ''}
											</div>
										</div>
                </div>
            `;
        });

        usersHtml += '</div>';

        const userCountWord = users.length === 1 ? tr('users.userCountOne') : (users.length < 5 ? tr('users.userCountFew') : tr('users.userCountMany'));
        return `
            <div class="users-container">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
                    <h2 style="margin: 0;">${tr('users.pageTitle')}</h2>
                    <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="users-specialization-filter" style="font-weight: 500; white-space: nowrap;">${tr('users.specializationLabel')}</label>
                            <select 
                                id="users-specialization-filter" 
                                style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 200px; background: white;"
                                onchange="window.applyUsersFilter()"
                            >
                                <option value="">${tr('users.allSpecializations')}</option>
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
                                    ✕ ${tr('users.resetFilter')}
                                </button>
                            ` : ''}
                        </div>
                        <div style="display: flex; gap: 10px; align-items: center;">
                            <label for="users-sort-by" style="font-weight: 500; white-space: nowrap;">${tr('users.sortBy')}</label>
                            <select 
                                id="users-sort-by" 
                                style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 180px; background: white;"
                                onchange="window.applyUsersFilter()"
                            >
                                <option value="">${tr('users.noSort')}</option>
                                <option value="rating_as_worker" ${currentSortBy === 'rating_as_worker' ? 'selected' : ''}>${tr('users.sortRatingWorker')}</option>
                                <option value="rating_as_client" ${currentSortBy === 'rating_as_client' ? 'selected' : ''}>${tr('users.sortRatingClient')}</option>
                                <option value="hourly_rate" ${currentSortBy === 'hourly_rate' ? 'selected' : ''}>${tr('users.sortHourlyRate')}</option>
                            </select>
                            ${currentSortBy ? `
                                <select 
                                    id="users-sort-order" 
                                    style="padding: 8px 12px; border: 1px solid #ced4da; border-radius: 4px; min-width: 140px; background: white;"
                                    onchange="window.applyUsersFilter()"
                                >
                                    <option value="desc" ${currentSortOrder === 'desc' ? 'selected' : ''}>${tr('users.sortDesc')}</option>
                                    <option value="asc" ${currentSortOrder === 'asc' ? 'selected' : ''}>${tr('users.sortAsc')}</option>
                                </select>
                            ` : ''}
                        </div>
                    </div>
                </div>
                ${users.length === 0 ? `
                    <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                        <p>${tr('users.noUsersFound')}${currentSpecializationFilter ? ' ' + tr('users.noUsersBySpec') : ''}.</p>
                        ${currentSpecializationFilter ? '<p>' + tr('users.tryOtherSpec') + '</p>' : ''}
                    </div>
                ` : `
                    <p style="color: #7f8c8d; margin-bottom: 20px;">${tr('users.found')} ${users.length} ${userCountWord}</p>
                    ${usersHtml}
                `}
            </div>
        `;
    } catch (error) {
        console.error('[Users] Error loading users:', error);
        return `
            <div class="users-container">
                <h2>${tr('users.pageTitle')}</h2>
                <p class="error">${tr('users.loadError')}: ${error.message}</p>
            </div>
        `;
    }
});
