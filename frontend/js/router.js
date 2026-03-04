// Simple SPA Router
class Router {
    constructor() {
        this.routes = {};
        this.currentRoute = null;
        this.initEventListeners();
    }

    // Register a route
    register(path, component) {
        this.routes[path] = component;
    }

    // Navigate to a route
    navigate(path) {
        if (!this.routes[path]) {
            console.error(`Route not found: ${path}`);
            return;
        }

        this.currentRoute = path;
        
        // Update URL without reloading
        window.history.pushState({}, '', `#${path}`);
        
        // Update active nav links
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === path) {
                link.classList.add('active');
            }
        });

        // Render the component
        this.render();
    }

    // Render current route
    async render() {
        const app = document.getElementById('app');
        const component = this.routes[this.currentRoute];

        if (typeof component === 'function') {
            app.innerHTML = '<div class="spinner"></div>';
            try {
                const html = await component();
                app.innerHTML = html;
            } catch (error) {
                console.error('Error rendering component:', error);
                app.innerHTML = `
                    <div class="empty-state">
                        <h3>Ошибка загрузки</h3>
                        <p>${error.message}</p>
                    </div>
                `;
            }
        } else {
            app.innerHTML = component;
        }
    }

    initEventListeners() {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-page]')) {
                e.preventDefault();
                const page = e.target.dataset.page;
                this.navigate(page);
            }
        });

        // Handle browser back/forward
        window.addEventListener('popstate', () => {
            const hash = window.location.hash.slice(1) || 'home';
            if (this.routes[hash]) {
                this.currentRoute = hash;
                this.render();
            }
        });

        // Load initial route
        window.addEventListener('DOMContentLoaded', () => {
            const hash = window.location.hash.slice(1) || 'home';
            this.navigate(hash);
        });
    }
}

// Create global router instance
window.router = new Router();
