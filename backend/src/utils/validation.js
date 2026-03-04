/**
 * Input validation utilities
 */

const MAX_CONTACT_LINKS = 10;
const MAX_TAGS = 20;
const MAX_TITLE_LENGTH = 200;
const MAX_DESCRIPTION_LENGTH = 5000;

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Validate UUID format
 */
function isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    
    // Remove potential XSS vectors
    return str
        .trim()
        .slice(0, maxLength)
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '');
}

/**
 * Validate task data
 */
function validateTask(taskData) {
    const errors = [];

    if (!taskData.title || typeof taskData.title !== 'string') {
        errors.push('Title is required');
    } else if (taskData.title.length > MAX_TITLE_LENGTH) {
        errors.push(`Title must be less than ${MAX_TITLE_LENGTH} characters`);
    }

    if (!taskData.description || typeof taskData.description !== 'string') {
        errors.push('Description is required');
    } else if (taskData.description.length > MAX_DESCRIPTION_LENGTH) {
        errors.push(`Description must be less than ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    if (!taskData.category || typeof taskData.category !== 'string') {
        errors.push('Category is required');
    }

    if (typeof taskData.budget_estimate !== 'number' || taskData.budget_estimate < 0) {
        errors.push('Budget estimate must be a positive number');
    }

    if (!taskData.deadline) {
        errors.push('Deadline is required');
    } else {
        const deadline = new Date(taskData.deadline);
        if (isNaN(deadline.getTime())) {
            errors.push('Invalid deadline format');
        } else if (deadline < new Date()) {
            errors.push('Deadline must be in the future');
        }
    }

    if (taskData.tags && Array.isArray(taskData.tags)) {
        if (taskData.tags.length > MAX_TAGS) {
            errors.push(`Maximum ${MAX_TAGS} tags allowed`);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate contact link
 */
function validateContactLink(link) {
    const errors = [];

    if (!link.label || typeof link.label !== 'string') {
        errors.push('Link label is required');
    } else if (link.label.length > 50) {
        errors.push('Link label must be less than 50 characters');
    }

    if (!link.url || typeof link.url !== 'string') {
        errors.push('Link URL is required');
    } else if (!isValidUrl(link.url)) {
        errors.push('Invalid URL format');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate contact links array
 */
function validateContactLinks(links) {
    if (!Array.isArray(links)) {
        return {
            valid: false,
            errors: ['Contact links must be an array']
        };
    }

    if (links.length > MAX_CONTACT_LINKS) {
        return {
            valid: false,
            errors: [`Maximum ${MAX_CONTACT_LINKS} contact links allowed`]
        };
    }

    const allErrors = [];
    links.forEach((link, index) => {
        const validation = validateContactLink(link);
        if (!validation.valid) {
            allErrors.push(`Link ${index + 1}: ${validation.errors.join(', ')}`);
        }
    });

    // Check for duplicate URLs
    const urls = links.map(l => l.url.toLowerCase());
    const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
    if (duplicates.length > 0) {
        allErrors.push('Duplicate URLs are not allowed');
    }

    return {
        valid: allErrors.length === 0,
        errors: allErrors
    };
}

/**
 * Validate profile update data
 */
function validateProfileUpdate(profileData) {
    const errors = [];

    if (profileData.contact_links) {
        const validation = validateContactLinks(profileData.contact_links);
        if (!validation.valid) {
            errors.push(...validation.errors);
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Validate rating
 */
function validateRating(rating) {
    return typeof rating === 'number' && rating >= 1 && rating <= 5;
}

module.exports = {
    isValidEmail,
    isValidUrl,
    isValidUUID,
    sanitizeString,
    validateTask,
    validateContactLink,
    validateContactLinks,
    validateProfileUpdate,
    validateRating,
    MAX_CONTACT_LINKS,
    MAX_TAGS,
    MAX_TITLE_LENGTH,
    MAX_DESCRIPTION_LENGTH
};
