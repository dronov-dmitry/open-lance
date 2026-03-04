/**
 * Open-Lance Cloudflare Workers Entry Point
 * MongoDB Atlas + Cloudflare Workers
 */

const mongoManager = require('./utils/mongoManager');
const authHandlers = require('./handlers/auth');
const taskHandlers = require('./handlers/tasks');
const userHandlers = require('./handlers/users');
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
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
        return handleOptions();
    }

    try {
        // Initialize MongoDB connection
        await mongoManager.connect();

        // Parse body for POST/PUT/PATCH requests
        let body = null;
        if (['POST', 'PUT', 'PATCH'].includes(method)) {
            body = await getRequestBody(request);
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
            }
        };

        // Authentication routes (no auth required)
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
        if (path === '/users/me' && method === 'GET') {
            const result = await userHandlers.getProfile(event);
            return addCorsHeaders(new Response(result.body, {
                status: result.statusCode,
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (path === '/users/me' && method === 'PUT') {
            const result = await userHandlers.updateProfile(event);
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
        return handleRequest(request, env);
    }
};
