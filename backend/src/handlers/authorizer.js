/**
 * JWT Authorizer for Cloudflare Workers
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @param {string} secret - JWT secret (from environment)
 * @returns {object} - Verification result
 */
function verifyToken(token, secret) {
    const JWT_SECRET = secret || process.env.JWT_SECRET || 'your-secret-key-change-this';
    
    if (!token) {
        return {
            isValid: false,
            message: 'No token provided'
        };
    }

    try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        console.log('Token verified for user:', decoded.userId);

        return {
            isValid: true,
            decoded: {
                userId: decoded.userId,
                email: decoded.email
            }
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        return {
            isValid: false,
            message: error.message || 'Invalid token'
        };
    }
}

module.exports = {
    verifyToken
};
