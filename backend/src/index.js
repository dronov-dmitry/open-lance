/**
 * Open-Lance Cloudflare Workers Entry Point
 * MongoDB Atlas + Cloudflare Workers
 */

const mongoManager = require('./utils/mongoManager');
const authHandlers = require('./handlers/auth');
const taskHandlers = require('./handlers/tasks');
const userHandlers = require('./handlers/users');
const applicationHandlers = require('./handlers/applications');
const messageHandlers = require('./handlers/messages');
const reviewHandlers = require('./handlers/reviews');
const { verifyToken } = require('./handlers/authorizer');
const response = require('./utils/response');

/**
 * CORS headers
 */
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
function handleOptions() {
    return new Response(null, {
        headers: corsHeaders
    });
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(response) {
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
        newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders
    });
}

/**
 * Parse request body
 */
async function getRequestBody(request) {
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
        return await request.json();
    }
    
    return {};
}

/**
 * Route handler
 */
async function handleRequest(request, env) {
    // Debug: Log env keys to see what secrets are available
    if (env) {
        console.log('[Backend] env keys:', Object.keys(env).join(', '));
        console.log('[Backend] env has EMAILJS_PUBLIC_KEY:', 'EMAILJS_PUBLIC_KEY' in env);
        console.log('[Backend] env has EMAILJS_SERVICE_ID:', 'EMAILJS_SERVICE_ID' in env);
        console.log('[Backend] env has EMAILJS_TEMPLATE_ID:', 'EMAILJS_TEMPLATE_ID' in env);
    } else {
        console.error('[Backend] env is null or undefined!');
    }
    
    const url = new URL(request.url);
    // Normalize path - remove trailing slash
    let path = url.pathname;
    if (path.endsWith('/') && path.length > 1) {
        path = path.slice(0, -1);
    }
    const method = request.method;


    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return handleOptions();
    }

    // Health check (no auth required, no MongoDB connection)
    if (path === '/health' && method === 'GET') {
        return addCorsHeaders(new Response(JSON.stringify({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'open-lance-backend',
            version: '3.0',
            env: {
                hasMongoUri: !!(env && env.MONGODB_URI),
                hasJwtSecret: !!(env && env.JWT_SECRET),
                mongoUriLength: env && env.MONGODB_URI ? env.MONGODB_URI.length : 0,
                envType: typeof env,
                envKeys: env ? Object.keys(env) : []
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }));
    }

    try {
        // Initialize MongoDB connection
        try {
            await mongoManager.connect(env);
            console.log('[Backend] MongoDB connection established');
        } catch (mongoError) {
            console.error('[Backend] MongoDB connection error:', mongoError);
            console.error('[Backend] MongoDB error details:', {
                message: mongoError.message,
                name: mongoError.name,
                stack: mongoError.stack
            });
            
            // For health check, don't fail
            if (path === '/health' && method === 'GET') {
                // Health check already handled above, but if we get here, return error
            } else {
                return addCorsHeaders(new Response(JSON.stringify({
                    error: 'Database connection failed',
                    message: mongoError.message,
                    details: 'Please check MongoDB URI and network access'
                }), {
                    status: 503,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }

        // Parse body for POST/PUT/PATCH requests (except for endpoints that don't need body)
        let body = null;
        const endpointsWithoutBody = ['/messages', '/messages/']; // Endpoints that might not need body
        const needsBody = ['POST', 'PUT', 'PATCH'].includes(method) && 
                         !path.match(/^\/messages\/[^/]+\/read$/); // markMessageRead doesn't need body
        
        if (needsBody) {
            try {
                body = await getRequestBody(request);
                console.log('[Backend] Body parsed successfully:', body ? 'yes' : 'no');
            } catch (bodyError) {
                console.error('[Backend] Error parsing request body:', bodyError);
                return addCorsHeaders(new Response(JSON.stringify({
                    error: 'Invalid request body',
                    message: bodyError.message
                }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }
        }

        // Create event object similar to AWS Lambda format for compatibility
        const event = {
            httpMethod: method,
            path: path,
            pathParameters: {},
            queryStringParameters: Object.fromEntries(url.searchParams),
            headers: Object.fromEntries(request.headers),
            body: body ? JSON.stringify(body) : null,
            requestContext: {
                authorizer: null
            },
            env: env // Pass Cloudflare Workers env to handlers
        };

        // Authentication routes (no auth required)
        console.log('[Backend] Checking auth routes:', { path, method });
        
        if (path === '/auth/login' && method === 'POST') {
            const result = await authHandlers.login(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/auth/register' && method === 'POST') {
            const result = await authHandlers.register(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/auth/verify' && method === 'GET') {
            const result = await authHandlers.verifyEmail(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // Check resend-verification with multiple possible path formats
        if ((path === '/auth/resend-verification' || path.startsWith('/auth/resend-verification')) && method === 'POST') {
            console.log('[Backend] ✓ Matched resend-verification route');
            console.log('[Backend] Path:', path, 'Method:', method);
            console.log('[Backend] Processing resend-verification request');
            console.log('[Backend] Event body:', event.body);
            const result = await authHandlers.resendVerificationEmail(event);
            console.log('[Backend] Verification email resend result:', result.statusCode);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        console.log('[Backend] No public route matched, checking auth...');

        // Extract and verify JWT token for protected routes
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return addCorsHeaders(new Response(JSON.stringify({
                error: 'Unauthorized',
                message: 'Missing or invalid authorization header'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        const token = authHeader.substring(7);
        const authResult = verifyToken(token, env.JWT_SECRET);
        
        if (!authResult.isValid) {
            return addCorsHeaders(new Response(JSON.stringify({
                error: 'Unauthorized',
                message: authResult.message
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        event.requestContext.authorizer = authResult.decoded;

        // Protected Auth routes
        if (path === '/auth/change-password' && method === 'POST') {
            const result = await authHandlers.changePassword(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // Task routes
        if (path === '/tasks' && method === 'GET') {
            const result = await taskHandlers.getTasks(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/tasks' && method === 'POST') {
            const result = await taskHandlers.createTask(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/tasks\/[^/]+$/) && method === 'GET') {
            event.pathParameters.id = path.split('/')[2];
            const result = await taskHandlers.getTask(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/tasks\/[^/]+$/) && method === 'PUT') {
            event.pathParameters.id = path.split('/')[2];
            const result = await taskHandlers.updateTask(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/tasks\/[^/]+$/) && method === 'DELETE') {
            event.pathParameters.id = path.split('/')[2];
            const result = await taskHandlers.deleteTask(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/tasks\/[^/]+\/apply$/) && method === 'POST') {
            event.pathParameters.id = path.split('/')[2];
            const result = await taskHandlers.applyToTask(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/tasks\/[^/]+\/match$/) && method === 'POST') {
            event.pathParameters.id = path.split('/')[2];
            const result = await taskHandlers.matchWorker(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // User routes
        if (path === '/users' && method === 'GET') {
            const result = await userHandlers.getUsers(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/users/specializations' && method === 'GET') {
            const result = await userHandlers.getSpecializations(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/users/me' && method === 'GET') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = 'me';
            const result = await userHandlers.getProfile(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/users\/[^/]+$/) && method === 'GET') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = path.split('/')[2];
            const result = await userHandlers.getProfile(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/users/me' && method === 'PUT') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = 'me';
            const result = await userHandlers.updateProfile(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // --- Reviews ---
        if (path.match(/^\/users\/[^/]+\/reviews$/) && method === 'GET') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = path.split('/')[2];
            const result = await reviewHandlers.getUserReviews(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/users\/[^/]+\/reviews\/can-review$/) && method === 'GET') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = path.split('/')[2];
            const result = await reviewHandlers.canReviewUser(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/users\/[^/]+\/reviews$/) && method === 'POST') {
            event.pathParameters = event.pathParameters || {};
            event.pathParameters.userId = path.split('/')[2];
            const result = await reviewHandlers.submitReview(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/users\/[^/]+\/reviews\/[^/]+$/) && method === 'PUT') {
            event.pathParameters = event.pathParameters || {};
            const parts = path.split('/');
            event.pathParameters.userId = parts[2];
            event.pathParameters.reviewId = parts[4];
            const result = await reviewHandlers.updateReview(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/users/me/contacts' && method === 'POST') {
            const result = await userHandlers.addContactLink(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/users\/me\/contacts\/[^/]+$/) && method === 'DELETE') {
            event.pathParameters.linkId = path.split('/')[4];
            const result = await userHandlers.removeContactLink(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // Admin routes
        if (path === '/admin/users/role' && method === 'PUT') {
            const result = await userHandlers.updateUserRole(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/admin/users/ban' && method === 'PUT') {
            const result = await userHandlers.updateUserStatus(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // Messaging routes
        if (path === '/messages' && method === 'POST') {
            const result = await messageHandlers.sendMessage(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/messages' && method === 'GET') {
            const result = await messageHandlers.getMessages(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/messages\/[^/]+\/read$/) && method === 'PUT') {
            event.pathParameters.messageId = path.split('/')[2];
            const result = await messageHandlers.markMessageRead(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // Application routes
        if (path === '/applications/me' && method === 'GET') {
            const result = await applicationHandlers.getMyApplications(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/applications\/task\/[^/]+$/) && method === 'GET') {
            event.pathParameters.taskId = path.split('/')[3];
            const result = await applicationHandlers.getTaskApplications(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/applications\/[^/]+$/) && method === 'PUT') {
            event.pathParameters.id = path.split('/')[2];
            const result = await applicationHandlers.updateApplicationStatus(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/applications\/[^/]+\/message$/) && method === 'PUT') {
            event.pathParameters.id = path.split('/')[2];
            const result = await applicationHandlers.updateApplicationMessage(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path.match(/^\/applications\/[^/]+$/) && method === 'DELETE') {
            event.pathParameters.id = path.split('/')[2];
            const result = await applicationHandlers.deleteApplication(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        // 404 Not Found
        return addCorsHeaders(new Response(JSON.stringify({
            error: 'Not Found',
            message: `Route ${method} ${path} not found`
        }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
        }));

    } catch (error) {
        console.error('Worker error:', error);
        return addCorsHeaders(new Response(JSON.stringify({
            error: 'Internal Server Error',
            message: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        }));
    }
}

/**
 * Cloudflare Workers export
 */
export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env, ctx);
    }
};
