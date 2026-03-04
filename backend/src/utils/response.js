/**
 * HTTP Response utilities
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key',
    'Access-Control-Allow-Credentials': 'true'
};

function success(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: true,
            data
        })
    };
}

function error(message, statusCode = 400, details = null) {
    return {
        statusCode,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            success: false,
            error: {
                message,
                details
            }
        })
    };
}

function unauthorized(message = 'Unauthorized') {
    return error(message, 401);
}

function forbidden(message = 'Forbidden') {
    return error(message, 403);
}

function notFound(message = 'Not found') {
    return error(message, 404);
}

function serverError(message = 'Internal server error', details = null) {
    console.error('Server error:', message, details);
    return error(message, 500, details);
}

function tooManyRequests(message = 'Too many requests') {
    return error(message, 429);
}

module.exports = {
    success,
    error,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    tooManyRequests
};
