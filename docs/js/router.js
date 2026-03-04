// Simple client-side router
window.router = (function() {
    const routes = {};
    let current = '';

    function register(name, handler) {
        routes[name] = handler;
    }

    async function navigate(name) {
        current = name;
        const app = document.getElementById('app');
        if (!routes[name]) {
            app.innerHTML = '<h2>Страница не найдена</h2>';
            return;
        }
        app.innerHTML = '<p>Загрузка...</p>';
        const content = await routes[name]();
        app.innerHTML = content;
    }

    // Initialize links
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[data-page]');
        if (a) {
            e.preventDefault();
            const page = a.getAttribute('data-page');
            navigate(page);
        }
    });

    return { register, navigate };
})();
