/**
 * Authentication handlers
 * Using MongoDB Atlas for data storage
 */

const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const mongoManager = require('../utils/mongoManager');
const response = require('../utils/response');
const validation = require('../utils/validation');

const JWT_EXPIRATION = '7d';

/**
 * Login handler
 */
async function login(event) {
    try {
        // Get JWT_SECRET from Cloudflare Workers env
        const JWT_SECRET = event.env?.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this';
        
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        if (!password || password.length < 6) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid password' })
            };
        }

        // TODO: Replace with real authentication
        // For now, mock authentication
        
        // Query user by email
        const user = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (!user) {
            return {
                statusCode: 401,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
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

        // Return response directly without wrapper for auth endpoints
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    rating_as_client: user.rating_as_client,
                    rating_as_worker: user.rating_as_worker,
                    completed_tasks_client: user.completed_tasks_client,
                    completed_tasks_worker: user.completed_tasks_worker
                }
            })
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Login failed: ' + error.message })
        };
    }
}

/**
 * Register handler
 */
async function register(event) {
    try {
        // Get JWT_SECRET from Cloudflare Workers env
        const JWT_SECRET = event.env?.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this';
        
        const body = JSON.parse(event.body);
        const { email, password } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        if (!password || password.length < 6) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Password must be at least 6 characters' })
            };
        }

        // Check if user already exists
        const existingUser = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (existingUser) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'User with this email already exists' })
            };
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

        // Generate JWT token for auto-login after registration
        const token = jwt.sign(
            {
                userId: userId,
                email: newUser.email
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRATION }
        );

        // Return response directly without wrapper for auth endpoints
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                token,
                user: {
                    user_id: userId,
                    email: newUser.email,
                    rating_as_client: 0,
                    rating_as_worker: 0,
                    completed_tasks_client: 0,
                    completed_tasks_worker: 0
                }
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'User with this email already exists' })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Registration failed: ' + error.message })
        };
    }
}

module.exports = {
    login,
    register
};
