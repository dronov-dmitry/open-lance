/**
 * Private Messaging handlers
 * Using MongoDB Atlas for data storage
 */

const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

/**
 * Send a new private message
 */
async function sendMessage(event) {
    try {
        const body = JSON.parse(event.body);
        const { receiverId, content } = body.data || body;
        const senderId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(receiverId)) {
            return response.error('Invalid receiver user ID', 400);
        }

        if (!content || content.trim().length === 0) {
            return response.error('Message content cannot be empty', 400);
        }
        
        if (content.length > 2000) {
            return response.error('Message is too long (max 2000 characters)', 400);
        }

        if (senderId === receiverId) {
            return response.error('Cannot send message to yourself', 400);
        }

        // Verify receiver exists
        const receiver = await mongoManager.findOne('users', { user_id: receiverId });
        if (!receiver) {
            return response.notFound('Receiver not found');
        }

        const now = new Date().toISOString();
        const newMessage = {
            message_id: uuidv4(),
            sender_id: senderId,
            receiver_id: receiverId,
            content: validation.sanitizeString(content, 2000),
            read: false,
            created_at: now
        };

        await mongoManager.insertOne('messages', newMessage);

        return response.success({ message: 'Message sent successfully', message_id: newMessage.message_id }, 201);
    } catch (error) {
        console.error('Error sending message:', error);
        return response.serverError('Failed to send message', error.message);
    }
}

/**
 * Get messages (Inbox / Sent)
 */
async function getMessages(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const type = event.queryStringParameters?.type || 'inbox'; // 'inbox' or 'sent'
        
        let query = {};
        if (type === 'sent') {
            query.sender_id = userId;
        } else {
            query.receiver_id = userId;
        }

        // Fetch messages sorting by newest first
        const messages = await mongoManager.find('messages', query, { sort: { created_at: -1 } });

        // Get unique user IDs to fetch their names for the UI
        const relatedUserIds = [...new Set(messages.map(m => type === 'sent' ? m.receiver_id : m.sender_id))];
        
        if (relatedUserIds.length > 0) {
            const users = await mongoManager.find('users', { user_id: { $in: relatedUserIds } });
            const userMap = users.reduce((acc, user) => {
                acc[user.user_id] = { name: user.name, email: user.email, avatar: user.avatar_url, role: user.role };
                return acc;
            }, {});

            // Enrich messages with sender/receiver details
            messages.forEach(m => {
                const targetId = type === 'sent' ? m.receiver_id : m.sender_id;
                m.related_user = userMap[targetId] || { name: 'Удаленный пользователь' };
            });
        }

        // Remove DB _id for safety
        const safeMessages = messages.map(m => {
            const copy = { ...m };
            delete copy._id;
            return copy;
        });

        return response.success(safeMessages);
    } catch (error) {
        console.error('Error getting messages:', error);
        return response.serverError('Failed to get messages', error.message);
    }
}

/**
 * Mark message as read
 */
async function markMessageRead(event) {
    try {
        const messageId = event.pathParameters.messageId;
        const userId = event.requestContext.authorizer.userId;

        if (!validation.isValidUUID(messageId)) {
            return response.error('Invalid message ID', 400);
        }

        // Ensure the message belongs to the current user (as receiver)
        const message = await mongoManager.findOne('messages', { message_id: messageId });
        if (!message) {
            return response.notFound('Message not found');
        }

        if (message.receiver_id !== userId) {
            return response.error('Forbidden: You can only mark your own inbox messages as read', 403);
        }

        if (!message.read) {
            await mongoManager.updateOne('messages', 
                { message_id: messageId },
                { $set: { read: true } }
            );
        }

        return response.success({ message: 'Marked as read' });
    } catch (error) {
        console.error('Error marking message as read:', error);
        return response.serverError('Failed to mark message as read', error.message);
    }
}

/**
 * Get unread messages count (inbox only)
 */
async function getUnreadCount(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        const count = await mongoManager.getCollection('messages').countDocuments({
            receiver_id: userId,
            read: false
        });
        return response.success({ unreadCount: count });
    } catch (error) {
        console.error('Error getting unread count:', error);
        return response.serverError('Failed to get unread count', error.message);
    }
}

module.exports = {
    sendMessage,
    getMessages,
    markMessageRead,
    getUnreadCount
};
