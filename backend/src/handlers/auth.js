/**
 * Authentication handlers
 * Using MongoDB Atlas for data storage
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRATION = '7d';

/**
 * Login handler
 */
async function login(event) {
    try {
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return response.error('Invalid email address');
        }

        if (!password || password.length < 6) {
            return response.error('Invalid password');
        }

        // TODO: Replace with real authentication
        // For now, mock authentication
        
        // Query user by email
        const user = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (!user) {
            return response.unauthorized('Invalid credentials');
        }

        // TODO: Verify password hash
        // For now, just accept any password
        
        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        return response.success({
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                rating_as_client: user.rating_as_client,
                rating_as_worker: user.rating_as_worker,
                completed_tasks_client: user.completed_tasks_client,
                completed_tasks_worker: user.completed_tasks_worker
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        return response.serverError('Login failed', error.message);
    }
}

/**
 * Register handler
 */
async function register(event) {
    try {
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return response.error('Invalid email address');
        }

        if (!password || password.length < 6) {
            return response.error('Password must be at least 6 characters');
        }

        // Check if user already exists
        const existingUser = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (existingUser) {
            return response.error('User with this email already exists');
        }

        // Create new user
        const userId = uuidv4();
        const now = new Date().toISOString();

        const newUser = {
            user_id: userId,
            email: email.toLowerCase(),
            // TODO: Hash password properly
            password_hash: password, // This is NOT secure - use bcrypt in production
            created_at: now,
            updated_at: now,
            rating_as_client: 0,
            rating_as_worker: 0,
            completed_tasks_client: 0,
            completed_tasks_worker: 0,
            contact_links: []
        };

        // Store user in MongoDB
        await mongoManager.insertOne('users', newUser);

        return response.success({
            success: true,
            message: 'Registration successful. Please login.',
            user_id: userId
        }, 201);
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return response.error('User with this email already exists');
        }
        
        return response.serverError('Registration failed', error.message);
    }
}

module.exports = {
    login,
    register
};
