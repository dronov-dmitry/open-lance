/**
 * User/Profile handlers
 * Using MongoDB Atlas for data storage
 */

const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

/**
 * Get all users
 */
async function getUsers(event) {
    try {
        await mongoManager.connect(event.env);
        
        const queryParams = event.queryStringParameters || {};
        const { specialization, search, sortBy, sortOrder } = queryParams;

        // Build query for filtering
        let query = {};
        
        // Filter by specialization (from specializations array)
        if (specialization && specialization.trim()) {
            // Match if any specialization in array exactly matches the filter value (case-insensitive)
            const specializationValue = specialization.trim();
            query.specializations = { 
                $elemMatch: { 
                    $regex: `^${specializationValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 
                    $options: 'i' 
                } 
            };
        }
        
        // Search in name, title, bio, specializations
        if (search && search.trim()) {
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { title: { $regex: search.trim(), $options: 'i' } },
                { bio: { $regex: search.trim(), $options: 'i' } },
                { specializations: { $elemMatch: { $regex: search.trim(), $options: 'i' } } }
            ];
        }

        // Build sort object
        let sortObj = { created_at: -1 }; // Default sort by creation date
        if (sortBy) {
            const order = sortOrder === 'asc' ? 1 : -1;
            if (sortBy === 'rating_as_worker') {
                // Sort by worker rating
                sortObj = { rating_as_worker: order, created_at: -1 };
            } else if (sortBy === 'rating_as_client') {
                // Sort by client rating
                sortObj = { rating_as_client: order, created_at: -1 };
            } else if (sortBy === 'hourly_rate') {
                // Sort by hourly rate
                sortObj = { hourly_rate: order, created_at: -1 };
            }
        }

        const users = await mongoManager.find('users', query, {
            sort: sortObj
        });
        
        // Post-process: replace null values with default value (2.5) for sorting
        let processedUsers = users;
        if (sortBy && users.length > 0) {
            const defaultValue = 2.5;
            
            // Replace null/undefined values with default value
            processedUsers = users.map(user => {
                const processedUser = { ...user };
                if (sortBy === 'rating_as_worker') {
                    if (processedUser.rating_as_worker === null || processedUser.rating_as_worker === undefined) {
                        processedUser.rating_as_worker = defaultValue;
                    }
                } else if (sortBy === 'rating_as_client') {
                    if (processedUser.rating_as_client === null || processedUser.rating_as_client === undefined) {
                        processedUser.rating_as_client = defaultValue;
                    }
                } else if (sortBy === 'hourly_rate') {
                    if (processedUser.hourly_rate === null || processedUser.hourly_rate === undefined) {
                        processedUser.hourly_rate = defaultValue;
                    }
                }
                return processedUser;
            });
            
            // Re-sort with replaced values
            if (sortBy === 'rating_as_worker') {
                const order = sortOrder === 'asc' ? 1 : -1;
                processedUsers.sort((a, b) => {
                    const aVal = a.rating_as_worker || defaultValue;
                    const bVal = b.rating_as_worker || defaultValue;
                    return (aVal - bVal) * order;
                });
            } else if (sortBy === 'rating_as_client') {
                const order = sortOrder === 'asc' ? 1 : -1;
                processedUsers.sort((a, b) => {
                    const aVal = a.rating_as_client || defaultValue;
                    const bVal = b.rating_as_client || defaultValue;
                    return (aVal - bVal) * order;
                });
            } else if (sortBy === 'hourly_rate') {
                const order = sortOrder === 'asc' ? 1 : -1;
                processedUsers.sort((a, b) => {
                    const aVal = a.hourly_rate || defaultValue;
                    const bVal = b.hourly_rate || defaultValue;
                    return (aVal - bVal) * order;
                });
            }
        }

        // Build plain objects for response (avoid BSON/serialization errors in Workers)
        const safeUsers = processedUsers.map(user => ({
            user_id: user.user_id ? String(user.user_id) : null,
            name: user.name != null ? String(user.name) : null,
            email: user.email != null ? String(user.email) : null,
            title: user.title != null ? String(user.title) : null,
            bio: user.bio != null ? String(user.bio) : null,
            avatar_url: user.avatar_url != null ? String(user.avatar_url) : null,
            specializations: Array.isArray(user.specializations) ? user.specializations.map(s => (s != null ? String(s) : '')) : [],
            portfolio_url: user.portfolio_url != null ? String(user.portfolio_url) : null,
            telegram_url: user.telegram_url != null ? String(user.telegram_url) : null,
            rating_as_worker: user.rating_as_worker != null ? Number(user.rating_as_worker) : null,
            rating_as_client: user.rating_as_client != null ? Number(user.rating_as_client) : null,
            hourly_rate: user.hourly_rate != null ? Number(user.hourly_rate) : null,
            created_at: user.created_at ? (user.created_at instanceof Date ? user.created_at.toISOString() : String(user.created_at)) : null,
            role: user.role != null ? String(user.role) : null,
            status: user.status != null ? String(user.status) : null,
            review_count: user.review_count != null ? Number(user.review_count) : null
        }));

        return response.success(safeUsers);
    } catch (error) {
        console.error('Error getting users:', error);
        return response.serverError('Failed to get users', error.message);
    }
}

/**
 * Get all unique specializations from all users
 */
async function getSpecializations(event) {
    try {
        await mongoManager.connect(event.env);
        
        // Find all users and filter those with non-empty specializations
        const users = await mongoManager.find('users', {
            specializations: { $exists: true, $ne: null }
        });
        
        // Extract all specializations and make them unique
        const allSpecializations = new Set();
        users.forEach(user => {
            if (user.specializations && Array.isArray(user.specializations)) {
                user.specializations.forEach(spec => {
                    if (spec && spec.trim()) {
                        allSpecializations.add(spec.trim());
                    }
                });
            }
        });
        
        const sortedSpecializations = Array.from(allSpecializations).sort();
        
        return response.success({ specializations: sortedSpecializations });
    } catch (error) {
        console.error('Error getting specializations:', error);
        return response.serverError('Failed to get specializations', error.message);
    }
}

/**
 * Get user profile
 */
async function getProfile(event) {
    try {
        const pathUserId = event.pathParameters.userId;
        const currentUserId = event.requestContext.authorizer.userId;

        // Resolve 'me' to current user ID
        const userId = pathUserId === 'me' ? currentUserId : pathUserId;

        if (!validation.isValidUUID(userId)) {
            return response.error('Invalid user ID');
        }

        // Get user from MongoDB
        const user = await mongoManager.findOne('users', { user_id: userId });

        if (!user) {
            return response.notFound('User not found');
        }

        // Remove sensitive data
        delete user.password_hash;
        delete user._id;

        // If not own profile, hide contact links unless they have matched tasks
        if (userId !== currentUserId) {
            // TODO: Check if users have matched tasks together
            // For now, hide contact links
            delete user.contact_links;
        }

        return response.success(user);
    } catch (error) {
        console.error('Error getting profile:', error);
        return response.serverError('Failed to get profile', error.message);
    }
}

/**
 * Update user profile
 */
async function updateProfile(event) {
    try {
        const body = JSON.parse(event.body);
        const profileData = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        // Validate profile data
        const validationResult = validation.validateProfileUpdate(profileData);
        if (!validationResult.valid) {
            return response.error('Validation failed', 400, validationResult.errors);
        }

        // Build update object
        const updates = {};
        
        // Only allow updating certain fields
        const allowedFields = ['contact_links', 'name', 'title', 'bio', 'avatar_url', 'hourly_rate', 'portfolio_url', 'telegram_url', 'specializations'];
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                if (field === 'contact_links') {
                    // Sanitize URLs
                    updates[field] = profileData[field].map(link => ({
                        label: validation.sanitizeString(link.label, 50),
                        url: link.url
                    }));
                } else if (['name', 'title'].includes(field)) {
                    updates[field] = validation.sanitizeString(profileData[field], 100);
                } else if (field === 'bio') {
                    // Bio needs to allow basic newlines, sanitizeString strips tags but keeps text
                    updates[field] = validation.sanitizeString(profileData[field], 1000);
                } else if (field === 'hourly_rate') {
                    // Validate hourly rate: must be positive number or null
                    if (profileData[field] === null || profileData[field] === '') {
                        updates[field] = null;
                    } else {
                        const rate = parseFloat(profileData[field]);
                        if (isNaN(rate) || rate < 0) {
                            return response.error('Hourly rate must be a positive number or empty', 400);
                        }
                        updates[field] = rate;
                    }
                } else if (field === 'portfolio_url') {
                    // Validate URL format
                    if (profileData[field] && profileData[field].trim()) {
                        try {
                            new URL(profileData[field]);
                            updates[field] = profileData[field].trim();
                        } catch {
                            return response.error('Invalid portfolio URL format', 400);
                        }
                    } else {
                        updates[field] = null;
                    }
                } else if (field === 'telegram_url') {
                    // Validate URL format (e.g. https://t.me/channel)
                    if (profileData[field] && profileData[field].trim()) {
                        try {
                            new URL(profileData[field]);
                            updates[field] = profileData[field].trim();
                        } catch {
                            return response.error('Invalid Telegram URL format', 400);
                        }
                    } else {
                        updates[field] = null;
                    }
                } else if (field === 'specializations') {
                    // Handle specializations: array of strings
                    if (Array.isArray(profileData[field])) {
                        // Sanitize each specialization
                        updates[field] = profileData[field]
                            .map(spec => validation.sanitizeString(spec, 50).trim())
                            .filter(spec => spec.length > 0);
                    } else if (profileData[field] === null || profileData[field] === '') {
                        updates[field] = [];
                    } else {
                        // If it's a string, convert to array
                        const specs = String(profileData[field]).split(',').map(s => validation.sanitizeString(s, 50).trim()).filter(s => s.length > 0);
                        updates[field] = specs;
                    }
                } else {
                    updates[field] = profileData[field]; // avatar_url (validated previously)
                }
            }
        }

        // Always update updated_at
        updates.updated_at = new Date().toISOString();

        if (Object.keys(updates).length === 1) { // Only updated_at
            return response.error('No fields to update');
        }

        // Update profile in MongoDB
        const result = await mongoManager.updateOne(
            'users',
            { user_id: userId },
            { $set: updates },
            { returnUpdatedDocument: true }
        );

        // Remove sensitive data
        const cleanUser = result.document;
        delete cleanUser.password_hash;
        delete cleanUser._id;

        return response.success(cleanUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return response.serverError('Failed to update profile', error.message);
    }
}

/**
 * Add contact link
 */
async function addContactLink(event) {
    try {
        const body = JSON.parse(event.body);
        const linkData = body.data || body;
        const userId = event.requestContext.authorizer.userId;

        // Validate contact link
        const validationResult = validation.validateContactLink(linkData);
        if (!validationResult.valid) {
            return response.error('Validation failed', 400, validationResult.errors);
        }

        // Get current user
        const user = await mongoManager.findOne('users', { user_id: userId });

        if (!user) {
            return response.notFound('User not found');
        }

        const currentLinks = user.contact_links || [];

        // Check max links limit
        if (currentLinks.length >= validation.MAX_CONTACT_LINKS) {
            return response.error(`Maximum ${validation.MAX_CONTACT_LINKS} contact links allowed`);
        }

        // Check for duplicate URL
        if (currentLinks.some(link => link.url.toLowerCase() === linkData.url.toLowerCase())) {
            return response.error('This URL is already added');
        }

        // Add new link
        const sanitizedLink = {
            label: validation.sanitizeString(linkData.label, 50),
            url: linkData.url
        };

        // Update user with new link
        await mongoManager.updateOne(
            'users',
            { user_id: userId },
            { 
                $push: { contact_links: sanitizedLink },
                $set: { updated_at: new Date().toISOString() }
            }
        );

        return response.success({ 
            message: 'Contact link added successfully',
            link: sanitizedLink 
        }, 201);
    } catch (error) {
        console.error('Error adding contact link:', error);
        return response.serverError('Failed to add contact link', error.message);
    }
}

/**
 * Remove contact link
 */
async function removeContactLink(event) {
    try {
        const linkIndex = parseInt(event.pathParameters.linkId);
        const userId = event.requestContext.authorizer.userId;

        if (isNaN(linkIndex) || linkIndex < 0) {
            return response.error('Invalid link index');
        }

        // Get current user
        const user = await mongoManager.findOne('users', { user_id: userId });

        if (!user) {
            return response.notFound('User not found');
        }

        const currentLinks = user.contact_links || [];

        if (linkIndex >= currentLinks.length) {
            return response.error('Link not found');
        }

        // Remove link by index
        currentLinks.splice(linkIndex, 1);

        // Update user
        await mongoManager.updateOne(
            'users',
            { user_id: userId },
            { 
                $set: { 
                    contact_links: currentLinks,
                    updated_at: new Date().toISOString()
                }
            }
        );

        return response.success({ message: 'Contact link removed successfully' });
    } catch (error) {
        console.error('Error removing contact link:', error);
        return response.serverError('Failed to remove contact link', error.message);
    }
}

/**
 * Update user ratings (called after task completion)
 */
async function updateRating(userId, isClient, newRating) {
    try {
        const field = isClient ? 'rating_as_client' : 'rating_as_worker';
        const countField = isClient ? 'completed_tasks_client' : 'completed_tasks_worker';

        // Get current user
        const user = await mongoManager.findOne('users', { user_id: userId });

        if (!user) {
            throw new Error('User not found');
        }

        const currentRating = user[field] || 0;
        const currentCount = user[countField] || 0;

        // Calculate new average rating
        const totalRating = (currentRating * currentCount) + newRating;
        const newCount = currentCount + 1;
        const averageRating = totalRating / newCount;

        // Update user in MongoDB
        await mongoManager.updateOne(
            'users',
            { user_id: userId },
            { 
                $set: {
                    [field]: averageRating,
                    [countField]: newCount,
                    updated_at: new Date().toISOString()
                }
            }
        );

        return { success: true };
    } catch (error) {
        console.error('Error updating rating:', error);
        throw error;
    }
}

/**
 * Update user role (ADMIN ONLY)
 */
async function updateUserRole(event) {
    try {
        const body = JSON.parse(event.body);
        const { targetUserId, newRole } = body.data || body;
        const currentUserId = event.requestContext.authorizer.userId;
        const currentUserRole = event.requestContext.authorizer.role;

        if (currentUserRole !== 'ADMIN') {
            return response.error('Forbidden: Requires ADMIN role', 403);
        }

        if (!targetUserId || !['USER', 'ADMIN'].includes(newRole)) {
            return response.error('Invalid targetUserId or role (USER/ADMIN only)', 400);
        }

        const result = await mongoManager.updateOne(
            'users',
            { user_id: targetUserId },
            { $set: { role: newRole, updated_at: new Date().toISOString() } },
            { returnUpdatedDocument: true }
        );

        if (!result.modifiedCount) {
            return response.notFound('User not found or role unchanged');
        }

        return response.success({ message: `Role updated to ${newRole}`, user_id: targetUserId });
    } catch (error) {
        console.error('Error updating user role:', error);
        return response.serverError('Failed to update user role', error.message);
    }
}

/**
 * Update user status/Ban (ADMIN ONLY)
 */
async function updateUserStatus(event) {
    try {
        const body = JSON.parse(event.body);
        const { targetUserId, newStatus } = body.data || body;
        const currentUserRole = event.requestContext.authorizer.role;

        if (currentUserRole !== 'ADMIN') {
            return response.error('Forbidden: Requires ADMIN role', 403);
        }

        if (!targetUserId || !['ACTIVE', 'BANNED'].includes(newStatus)) {
            return response.error('Invalid targetUserId or status (ACTIVE/BANNED only)', 400);
        }

        const result = await mongoManager.updateOne(
            'users',
            { user_id: targetUserId },
            { $set: { status: newStatus, updated_at: new Date().toISOString() } }
        );

        if (!result.modifiedCount) {
            return response.notFound('User not found or status unchanged');
        }

        return response.success({ message: `User status changed to ${newStatus}`, user_id: targetUserId });
    } catch (error) {
        console.error('Error updating user status:', error);
        return response.serverError('Failed to update user status', error.message);
    }
}

module.exports = {
    getUsers,
    getProfile,
    updateProfile,
    addContactLink,
    removeContactLink,
    updateRating,
    updateUserRole,
    updateUserStatus,
    getSpecializations
};
