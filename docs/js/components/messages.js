// Messages Component
window.router.register('messages', async () => {
    if (!window.auth.isLoggedIn()) {
        return `
            <div class="empty-state">
                <h3>Необходима авторизация</h3>
                <p>Войдите в систему, чтобы просматривать личные сообщения</p>
                <button onclick="document.getElementById('loginModal').classList.add('active')" class="btn btn-primary">
                    Войти
                </button>
            </div>
        `;
    }

    // Expose global functions for the view
    window.messageState = { currentTab: 'inbox', replyingTo: null };
    
    window.loadMessagesTab = async (tab) => {
        window.messageState.currentTab = tab;
        const container = document.getElementById('messages-list');
        if (!container) return;
        
        container.innerHTML = '<div style="text-align: center; padding: 20px;"><div class="spinner"></div><p>Загрузка сообщений...</p></div>';
        
        // Update tab styling
        document.querySelectorAll('.msg-tab').forEach(t => t.classList.remove('active'));
        const activeTabBtn = document.querySelector(`.msg-tab[data-tab="${tab}"]`);
        if (activeTabBtn) activeTabBtn.classList.add('active');

        try {
            const resp = await window.api.request(`/messages?type=${tab}`, { method: 'GET' });
            const messages = resp.data || resp;
            
            if (!messages || messages.length === 0) {
                container.innerHTML = `<div class="empty-state"><p>${tab === 'inbox' ? 'У вас нет входящих сообщений' : 'Вы еще не отправляли сообщения'}</p></div>`;
                return;
            }

            let html = '<div class="messages-list">';
            for (const msg of messages) {
                const partnerName = msg.related_user.name || 'Без имени';
                const roleBadge = msg.related_user.role === 'ADMIN' ? '<span class="badge admin" style="font-size: 0.7rem; padding: 2px 5px;">Админ</span>' : '';
                const dateStr = new Date(msg.created_at).toLocaleString('ru-RU', { 
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                });
                const isUnread = tab === 'inbox' && !msg.read;

                html += `
                    <div class="message-card card ${isUnread ? 'unread' : ''}" style="${isUnread ? 'border-left: 4px solid var(--primary-color); background: rgba(var(--primary-rgb), 0.03);' : ''}">
                        <div class="message-header" style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px;">
                            <strong>${partnerName} ${roleBadge}</strong>
                            <span style="font-size: 0.8rem; color: #666;">${dateStr}</span>
                        </div>
                        <div class="message-content" style="white-space: pre-wrap; margin-bottom: 10px; color: var(--text-color);">${msg.content}</div>
                        <div class="message-actions" style="display: flex; gap: 10px; align-items: center;">
                            ${isUnread ? `<button class="btn btn-outline" style="font-size: 0.8rem; color: #2c3e50; border-color: #2c3e50;" onclick="window.markRead('${msg.message_id}')">Отметить как прочитанное</button>` : ''}
                            ${tab === 'inbox' ? `<button class="btn btn-primary" style="font-size: 0.8rem;" onclick="window.showReplyBox('${tab === 'sent' ? msg.receiver_id : msg.sender_id}', '${partnerName.replace(/'/g, "\\'")}')">Ответить</button>` : ''}
                        </div>
                    </div>
                `;
            }
            html += '</div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = `<div class="error">Ошибка загрузки сообщений: ${e.message}</div>`;
        }
    };

    window.markRead = async (messageId) => {
        try {
            await window.api.request(`/messages/${messageId}/read`, { method: 'PUT' });
            window.loadMessagesTab(window.messageState.currentTab);
            window.utils.showToast('Сообщение прочитано');
            // Dispatch event to update global unread counters if we add them later
        } catch (e) {
            window.utils.showToast(e.message, 'error');
        }
    };

    window.showReplyBox = (userId, userName) => {
        window.messageState.replyingTo = userId;
        document.getElementById('reply-modal-title').textContent = `Ответ для: ${userName}`;
        document.getElementById('reply-content').value = '';
        document.getElementById('reply-modal').classList.add('active');
    };

    window.sendReply = async () => {
        const content = document.getElementById('reply-content').value.trim();
        if (!content) {
            window.utils.showToast('Введите текст сообщения', 'error');
            return;
        }
        
        try {
            await window.api.request('/messages', {
                method: 'POST',
                body: JSON.stringify({ data: { receiverId: window.messageState.replyingTo, content } })
            });
            window.utils.showToast('Сообщение отправлено', 'success');
            document.getElementById('reply-modal').classList.remove('active');
        } catch (e) {
            window.utils.showToast(e.message, 'error');
        }
    };

    window.closeReplyModal = () => {
        document.getElementById('reply-modal').classList.remove('active');
        window.messageState.replyingTo = null;
    };

    // Load initial HTML structure synchronously, then wait a tick and load data
    setTimeout(() => window.loadMessagesTab('inbox'), 50);

    return `
        <div class="messages-container" style="max-width: 800px; margin: 0 auto; padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2>Личные сообщения</h2>
            </div>
            
            <div class="tabs" style="display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">
                <button class="msg-tab active" data-tab="inbox" onclick="window.loadMessagesTab('inbox')">Входящие</button>
                <button class="msg-tab" data-tab="sent" onclick="window.loadMessagesTab('sent')">Отправленные</button>
            </div>

            <div id="messages-list">
                <div style="text-align: center; padding: 40px;">
                    <div class="spinner"></div>
                </div>
            </div>
        </div>

        <!-- Reply Modal -->
        <div id="reply-modal" class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <span class="close-modal" onclick="window.closeReplyModal()">&times;</span>
                <h2 id="reply-modal-title" style="margin-bottom: 15px;">Отправить сообщение</h2>
                <div class="form-group">
                    <textarea id="reply-content" rows="4" style="width: 100%; resize: vertical; padding: 10px;" placeholder="Введите ваше сообщение..."></textarea>
                </div>
                <button class="btn btn-primary" onclick="window.sendReply()" style="width: 100%;">Отправить</button>
            </div>
        </div>
    `;
});
