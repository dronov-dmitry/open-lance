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
 * Send email via EmailJS
 */
async function sendEmailViaEmailJS(event, email, verificationLink) {
    try {
        // Check if EmailJS is configured
        console.log('[Email] Checking EmailJS configuration...');
        console.log('[Email] event exists:', !!event);
        console.log('[Email] event.env exists:', !!(event && event.env));
        if (event && event.env) {
            console.log('[Email] event.env keys:', Object.keys(event.env).join(', '));
            console.log('[Email] event.env has EMAILJS_PUBLIC_KEY:', 'EMAILJS_PUBLIC_KEY' in event.env);
            console.log('[Email] event.env has EMAILJS_SERVICE_ID:', 'EMAILJS_SERVICE_ID' in event.env);
            console.log('[Email] event.env has EMAILJS_TEMPLATE_ID:', 'EMAILJS_TEMPLATE_ID' in event.env);
        }
        
        if (!event || !event.env) {
            console.error('[Email] ❌ event.env is not available');
            throw new Error('Email service configuration error: event.env not available');
        }
        
        const publicKey = event.env.EMAILJS_PUBLIC_KEY;
        const serviceId = event.env.EMAILJS_SERVICE_ID;
        const templateId = event.env.EMAILJS_TEMPLATE_ID;
        
        console.log('[Email] Raw values - publicKey type:', typeof publicKey, 'value:', publicKey ? publicKey.substring(0, 5) + '...' : 'null/undefined');
        console.log('[Email] Raw values - serviceId type:', typeof serviceId, 'value:', serviceId ? serviceId.substring(0, 5) + '...' : 'null/undefined');
        console.log('[Email] Raw values - templateId type:', typeof templateId, 'value:', templateId ? templateId.substring(0, 5) + '...' : 'null/undefined');
        
        const hasPublicKey = !!(publicKey && publicKey.trim().length > 0);
        const hasServiceId = !!(serviceId && serviceId.trim().length > 0);
        const hasTemplateId = !!(templateId && templateId.trim().length > 0);
        
        console.log('[Email] EMAILJS_PUBLIC_KEY:', hasPublicKey ? `✅ Set (length: ${publicKey ? publicKey.length : 0})` : '❌ Missing or empty');
        console.log('[Email] EMAILJS_SERVICE_ID:', hasServiceId ? `✅ Set (length: ${serviceId ? serviceId.length : 0})` : '❌ Missing or empty');
        console.log('[Email] EMAILJS_TEMPLATE_ID:', hasTemplateId ? `✅ Set (length: ${templateId ? templateId.length : 0})` : '❌ Missing or empty');
        
        if (!hasPublicKey || !hasServiceId || !hasTemplateId) {
            const missing = [];
            if (!hasPublicKey) missing.push('EMAILJS_PUBLIC_KEY');
            if (!hasServiceId) missing.push('EMAILJS_SERVICE_ID');
            if (!hasTemplateId) missing.push('EMAILJS_TEMPLATE_ID');
            
            console.error(`[Email] ❌ EmailJS not fully configured. Missing or empty: ${missing.join(', ')}`);
            console.error('[Email] To fix: Set secrets in Cloudflare Workers:');
            console.error('[Email]   wrangler secret put EMAILJS_PUBLIC_KEY');
            console.error('[Email]   wrangler secret put EMAILJS_SERVICE_ID');
            console.error('[Email]   wrangler secret put EMAILJS_TEMPLATE_ID');
            throw new Error(`Email service not configured. Missing or empty secrets: ${missing.join(', ')}. Please configure EmailJS in Cloudflare Workers.`);
        }

        const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send';
        
        // Prepare email template parameters
        // We provide multiple variable names for the email address to cover common 
        // template configurations in the EmailJS dashboard.
        const templateParams = {
            user_email: email,
            to_email: email,
            email: email,
            to_name: email.split('@')[0], // Optional, just in case template uses it
            verification_link: verificationLink,
            time: new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })
        };

        const requestBody = {
            service_id: event.env.EMAILJS_SERVICE_ID,
            template_id: event.env.EMAILJS_TEMPLATE_ID,
            user_id: event.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        // If strict mode is enabled, EmailJS requires the private key as accessToken
        if (event.env.EMAILJS_PRIVATE_KEY) {
            requestBody.accessToken = event.env.EMAILJS_PRIVATE_KEY;
        }

        console.log('[Email] ✅ All EmailJS secrets are configured');
        console.log('[Email] Sending email via EmailJS to:', email);
        console.log('[Email] EmailJS Public Key (first 10 chars):', event.env.EMAILJS_PUBLIC_KEY.substring(0, 10) + '...');
        console.log('[Email] EmailJS Service ID:', event.env.EMAILJS_SERVICE_ID);
        console.log('[Email] EmailJS Template ID:', event.env.EMAILJS_TEMPLATE_ID);

        const response = await fetch(emailjsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorDetails = {};
            try {
                errorDetails = JSON.parse(errorText);
            } catch {
                errorDetails = { message: errorText };
            }
            
            console.error('[Email] EmailJS API error:', response.status);
            console.error('[Email] Error response:', errorText);
            console.error('[Email] Error details:', errorDetails);
            
            // Provide specific error messages
            let errorMessage = `Failed to send verification email. EmailJS API error: ${response.status}`;
            if (errorDetails.message) {
                errorMessage += ` - ${errorDetails.message}`;
            }
            
            throw new Error(errorMessage);
        }

        const responseData = await response.json().catch(() => ({}));
        console.log('[Email] Email successfully sent via EmailJS');
        console.log('[Email] EmailJS response:', responseData);
        
        return { success: true };
    } catch (error) {
        console.error('[Email] Error sending email via EmailJS:', error);
        console.error('[Email] Error stack:', error.stack);
        throw error; // Re-throw to let caller handle the error
    }
}

/**
 * Login handler
 */
async function login(event) {
    try {
        console.log('[Login] Starting login handler');
        console.log('[Login] Event body type:', typeof event.body);
        console.log('[Login] Event body:', event.body);
        
        // Get JWT_SECRET from Cloudflare Workers env
        const JWT_SECRET = event.env?.JWT_SECRET || process.env.JWT_SECRET || 'your-secret-key-change-this';
        
        if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-this') {
            console.error('[Login] JWT_SECRET is not set or using default value!');
        }
        
        // Parse body
        let body;
        try {
            if (!event.body) {
                console.error('[Login] Event body is null or undefined');
                return {
                    statusCode: 400,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: 'Request body is required' })
                };
            }
            
            if (typeof event.body === 'string') {
                body = JSON.parse(event.body);
            } else {
                body = event.body;
            }
        } catch (parseError) {
            console.error('[Login] Error parsing body:', parseError);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid JSON in request body: ' + parseError.message })
            };
        }
        
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
        console.log('[Login] Querying user with email:', email.toLowerCase());
        let user;
        try {
            user = await mongoManager.findOne('users', { 
                email: email.toLowerCase() 
            });
            console.log('[Login] User found:', user ? 'yes' : 'no');
        } catch (dbError) {
            console.error('[Login] Database error:', dbError);
            console.error('[Login] Database error stack:', dbError.stack);
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Database connection error: ' + dbError.message })
            };
        }

        if (!user) {
            return response.unauthorized('Неверный email или пароль');
        }

        if (!user.is_verified) {
            return response.unauthorized('Подтвердите Email. Ссылка была отправлена при регистрации.');
        }

        if (user.status === 'BANNED') {
            return response.forbidden('Ваш аккаунт заблокирован');
        }

        // TODO: Verify password hash
        // For now, just accept any password
        
        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                email: user.email,
                role: user.role || 'USER',
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
                    completed_tasks_worker: user.completed_tasks_worker,
                    role: user.role || 'USER',
                    status: user.status || 'ACTIVE',
                    is_verified: user.is_verified
                }
            })
        };
    } catch (error) {
        console.error('[Login] Unexpected error:', error);
        console.error('[Login] Error name:', error.name);
        console.error('[Login] Error message:', error.message);
        console.error('[Login] Error stack:', error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: 'Login failed: ' + error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
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
                body: JSON.stringify({ error: 'Пользователь с таким email уже существует' })
            };
        }

        // Create new user
        const userId = uuidv4();
        const verificationToken = uuidv4();
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
            contact_links: [],
            role: 'USER',
            status: 'ACTIVE',
            is_verified: false,
            verification_token: verificationToken
        };

        // Store user in MongoDB
        await mongoManager.insertOne('users', newUser);

        // EMAIL SENDING LOGIC - Send via EmailJS
        // Get host from request origin or FRONTEND_URL env variable
        let host = event.headers.origin;
        if (!host) {
            const frontendUrl = event.env.FRONTEND_URL || 'localhost:8080';
            // If FRONTEND_URL already has protocol, use it as is, otherwise add https://
            host = frontendUrl.startsWith('http://') || frontendUrl.startsWith('https://') 
                ? frontendUrl 
                : `https://${frontendUrl}`;
        }
        // Remove trailing slash if present
        host = host.replace(/\/$/, '');
        const verificationLink = `${host}/#/home?verify=${verificationToken}`;
        
        // Send email via EmailJS (required, no fallback)
        await sendEmailViaEmailJS(event, email, verificationLink);

        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Регистрация успешна! Письмо для подтверждения email отправлено на вашу почту. Проверьте почту и перейдите по ссылке для подтверждения.',
                emailSent: true
            })
        };
    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle duplicate email error
        if (error.code === 11000) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Пользователь с таким email уже существует' })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Registration failed: ' + error.message })
        };
    }
}

/**
 * Verify Email handler (GET /auth/verify?token=xxx)
 */
async function verifyEmail(event) {
    try {
        const token = event.queryStringParameters?.token;
        if (!token) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Токен не передан' })
            };
        }

        const user = await mongoManager.findOne('users', { verification_token: token });
        if (!user) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный или просроченный токен' })
            };
        }

        await mongoManager.updateOne(
            'users', 
            { user_id: user.user_id },
            { 
                $set: { is_verified: true },
                $unset: { verification_token: "" }
            }
        );

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: true, message: 'Email успешно подтвержден' })
        };

    } catch (error) {
        console.error('Verification error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Verification failed: ' + error.message })
        };
    }
}

/**
 * Resend verification email handler (POST /auth/resend-verification)
 */
async function resendVerificationEmail(event) {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Тело запроса пустое' })
            };
        }
        
        let body;
        try {
            body = JSON.parse(event.body);
        } catch (parseError) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный формат данных запроса' })
            };
        }
        
        const { email } = body;

        // Validate input
        if (!email || !validation.isValidEmail(email)) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Invalid email address' })
            };
        }

        // Find user by email
        const user = await mongoManager.findOne('users', { 
            email: email.toLowerCase() 
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: 'Если аккаунт с таким email существует и не подтвержден, письмо будет отправлено.' 
                })
            };
        }

        // If user is already verified, don't send email
        if (user.is_verified) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Email уже подтвержден' })
            };
        }

        // Generate new verification token
        const verificationToken = uuidv4();
        
        // Update user with new token
        await mongoManager.updateOne(
            'users',
            { user_id: user.user_id },
            { 
                $set: { 
                    verification_token: verificationToken,
                    updated_at: new Date().toISOString()
                }
            }
        );

        // Send verification email via EmailJS
        // Get host from request origin or FRONTEND_URL env variable
        let host = event.headers.origin || event.headers['origin'];
        if (!host) {
            const frontendUrl = event.env?.FRONTEND_URL || 'localhost:8080';
            // If FRONTEND_URL already has protocol, use it as is, otherwise add https://
            host = frontendUrl.startsWith('http://') || frontendUrl.startsWith('https://') 
                ? frontendUrl 
                : `https://${frontendUrl}`;
        }
        // Remove trailing slash if present
        host = host.replace(/\/$/, '');
        const verificationLink = `${host}/#/home?verify=${verificationToken}`;
        
        // Send email via EmailJS (required, no fallback)
        await sendEmailViaEmailJS(event, email, verificationLink);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Письмо для подтверждения email отправлено. Проверьте почту.',
                emailSent: true
            })
        };
    } catch (error) {
        console.error('Verification email resend error:', error);
        console.error('Verification email resend error stack:', error.stack);
        
        // Проверяем тип ошибки для более понятного сообщения
        let errorMessage = 'Не удалось отправить письмо для подтверждения email. Попробуйте позже или обратитесь в поддержку.';
        
        if (error.message) {
            if (error.message.includes('MongoDB') || error.message.includes('database')) {
                errorMessage = 'Ошибка подключения к базе данных. Попробуйте позже.';
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = 'Ошибка сети при отправке письма. Проверьте подключение к интернету.';
            } else if (error.message.includes('Email service') || error.message.includes('EmailJS') || error.message.includes('not configured')) {
                errorMessage = `Ошибка EmailJS: ${error.message}`;
            } else if (error.message.includes('Failed to send')) {
                errorMessage = 'Не удалось отправить письмо. Проверьте настройки EmailJS или обратитесь в поддержку.';
            }
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                error: errorMessage
            })
        };
    }
}

/**
 * Change Password handler (POST /auth/change-password)
 * Requires JWT token
 */
async function changePassword(event) {
    try {
        const userId = event.requestContext.authorizer.userId;
        
        if (!event.body) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Тело запроса пустое' })
            };
        }

        let body;
        try {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        } catch (e) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный формат JSON' })
            };
        }

        const { old_password, new_password } = body;

        if (!old_password || !new_password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Необходимо указать старый и новый пароль' })
            };
        }

        if (new_password.length < 6) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Новый пароль должен содержать минимум 6 символов' })
            };
        }

        // Find user
        const user = await mongoManager.findOne('users', { user_id: userId });
        
        if (!user) {
            return response.notFound('Пользователь не найден');
        }

        // Verify old password
        // TODO: Update to use bcrypt when hashed passwords are implemented
        if (user.password_hash !== old_password) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'Неверный старый пароль' })
            };
        }

        // Update password
        const now = new Date().toISOString();
        await mongoManager.updateOne(
            'users',
            { user_id: userId },
            { 
                $set: { 
                    password_hash: new_password,
                    updated_at: now
                }
            }
        );

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Пароль успешно изменен' })
        };

    } catch (error) {
        console.error('Change password error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: 'Ошибка сервера: ' + error.message })
        };
    }
}

module.exports = {
    login,
    register,
    verifyEmail,
    resendVerificationEmail,
    changePassword
};
