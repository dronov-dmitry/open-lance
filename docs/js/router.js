// Simple client-side router with History API support
window.router = (function() {
    const routes = {};
    let current = '';
    let currentProps = {};

    function register(name, handler) {
        routes[name] = handler;
    }

    async function renderRoute(name, props = {}) {
        current = name;
        currentProps = props;
        const app = document.getElementById('app');
        if (!routes[name]) {
            app.innerHTML = '<h2>Страница не найдена</h2>';
            return;
        }
        app.innerHTML = '<div style="text-align: center; padding: 50px;"><div class="spinner"></div></div>';
        try {
            const content = await routes[name](props);
            app.innerHTML = content;
        } catch (e) {
            console.error('Routing error:', e);
            app.innerHTML = `<div class="error" style="padding: 20px;">Ошибка загрузки страницы: ${e.message}</div>`;
        }
    }

    async function navigate(name, props = {}, options = {}) {
        // Prevent pushing the same state multiple times unnecessarily unless forced
        if (!options.force && current === name && JSON.stringify(currentProps) === JSON.stringify(props)) {
            return;
        }

        // Build a query string for URL visibility (optional, but helps with refreshes)
        let queryString = '';
        if (props && Object.keys(props).length > 0) {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(props)) {
                if (value !== undefined && value !== null) {
                    params.append(key, value);
                }
            }
            queryString = '?' + params.toString();
        }

        const url = `#/${name}${queryString}`;
        
        if (options.replace) {
            window.history.replaceState({ name, props }, '', url);
        } else {
            window.history.pushState({ name, props }, '', url);
        }

        await renderRoute(name, props);
    }

    function getCurrentParams() {
        return currentProps;
    }

    // Handle browser Back/Forward buttons
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.name) {
            renderRoute(e.state.name, e.state.props);
        } else {
            // Fallback to checking the hash format
            const hash = window.location.hash;
            if (hash.startsWith('#/')) {
                const parts = hash.substring(2).split('?');
                const name = parts[0];
                const props = {};
                if (parts[1]) {
                    const params = new URLSearchParams(parts[1]);
                    for (const [key, value] of params.entries()) {
                        props[key] = value;
                    }
                }
                renderRoute(name, props);
            } else {
                // Default route - show home page
                renderRoute('home');
            }
        }
    });

    // Initialize links
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-page]');
        if (a) {
            e.preventDefault();
            const page = a.getAttribute('data-page');
            navigate(page);
        }
    });

    return { register, navigate, getCurrentParams };
})();
