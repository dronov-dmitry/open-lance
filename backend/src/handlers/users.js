/**
 * User/Profile handlers
 * Using MongoDB Atlas for data storage
 */

const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

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
        const allowedFields = ['contact_links'];
        
        for (const field of allowedFields) {
            if (profileData[field] !== undefined) {
                if (field === 'contact_links') {
                    // Sanitize URLs
                    updates[field] = profileData[field].map(link => ({
                        label: validation.sanitizeString(link.label, 50),
                        url: link.url
                    }));
                } else {
                    updates[field] = profileData[field];
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

module.exports = {
    getProfile,
    updateProfile,
    addContactLink,
    removeContactLink,
    updateRating
};
