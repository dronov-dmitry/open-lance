// Basic auth helper (frontend side)
window.auth = (function() {
    function isLoggedIn() {
        return !!window.authToken;
    }

    function login(token) {
        window.authToken = token;
        window.dispatchEvent(new CustomEvent('auth:login'));
    }

    function logout() {
        window.authToken = null;
        window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return { isLoggedIn, login, logout };
})();
