import './style.css';
import './src/styles/design-system.css';
import { initChatWidget } from './src/components/ChatWidget.js';

// State management (simple)
const state = {
    user: null, // Logged in user info
    theme: localStorage.getItem('theme') || 'light',
    notifications: [],
};

// Initialize theme
document.documentElement.setAttribute('data-theme', state.theme);

// Initialize Chat Bot
initChatWidget();

// Router Function
const navigate = (path) => {
    window.location.hash = path;
};

const handleRoute = async () => {
    initChatWidget(); // Re-init on route
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    
    // Parse query params from hash: #/page?param=value
    const [path, queryStr] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr || ''));

    // Auth check (mock for now)
    const isAuthRequired = !['#/', '#/login', '#/register'].includes(path);
    const isLoggedIn = !!localStorage.getItem('token');
    
    if (isAuthRequired && !isLoggedIn) {
        navigate('#/login');
        return;
    }

    // Clean up current view
    app.innerHTML = '<div class="loader">Loading...</div>';

    // Route Mapping
    switch (path) {
        case '#/':
            const { renderLanding } = await import('./src/pages/landing.js');
            renderLanding(app);
            break;
        case '#/login':
            const { renderLogin } = await import('./src/pages/auth/login.js');
            renderLogin(app);
            break;
        case '#/register':
            const { renderRegister } = await import('./src/pages/auth/register.js');
            renderRegister(app);
            break;
        case '#/dashboard':
            renderAppShell(app, 'dashboard', params);
            break;
        case '#/tasks':
            renderAppShell(app, 'tasks', params);
            break;
        case '#/planning':
            renderAppShell(app, 'planning', params);
            break;
        case '#/habits':
            renderAppShell(app, 'habits', params);
            break;
        case '#/settings':
            renderAppShell(app, 'settings', params);
            break;
        default:
            app.innerHTML = '<h1>404 Not Found</h1>';
    }
};

// App Shell Renderer (Sidebar + Topbar + Content)
const renderAppShell = async (container, activePage, params = {}) => {
    // Basic sidebar and topbar HTML
    container.innerHTML = `
        <div class="layout-container">
            <aside id="sidebar"></aside>
            <div class="main-content" style="display: flex; flex-direction: column; min-height: 125vh;">
                <header id="topbar"></header>
                <main id="page-content" class="fade-in" style="flex: 1;"></main>
                <footer class="app-footer" style="padding: 24px 40px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); font-size: 0.85rem; color: var(--text-muted); font-weight: 600; transition: all 0.3s ease;">
                    <div>© 2026 <span style="color: var(--primary-color);">PlanBee</span> - Tăng cường hiệu suất làm việc 🚀</div>
                    <div style="display: flex; gap: 24px; align-items: center;">
                        <span style="display: flex; align-items: center; gap: 8px;">
                            Hệ thống: <span style="color: var(--success); font-weight: 800; display: inline-flex; align-items: center; gap: 5px;">
                                <span style="position: relative; width: 8px; height: 8px; background: var(--success); border-radius: 50%; display: inline-block;">
                                    <span style="position: absolute; inset: 0; background: var(--success); border-radius: 50%; animation: ping 1.5s infinite; opacity: 0.6;"></span>
                                </span>
                                ỔN ĐỊNH
                            </span>
                        </span>
                        <span style="opacity: 0.6;">Phiên bản: 1.2.0</span>
                    </div>
                </footer>
            </div>
        </div>
    `;

    // Import components
    const { renderSidebar } = await import('./src/components/Sidebar.js');
    const { renderTopbar } = await import('./src/components/Topbar.js');
    
    renderSidebar(document.getElementById('sidebar'), activePage);
    renderTopbar(document.getElementById('topbar'));

    // Render Actual Page Content
    const content = document.getElementById('page-content');
    switch (activePage) {
        case 'dashboard':
            const { renderDashboard } = await import('./src/pages/dashboard.js');
            renderDashboard(content, params);
            break;
        case 'tasks':
            const { renderTasks } = await import('./src/pages/tasks.js');
            renderTasks(content, params);
            break;
        case 'planning':
            const { renderPlanning } = await import('./src/pages/planning.js');
            renderPlanning(content, params);
            break;
        case 'habits':
            const { renderHabits } = await import('./src/pages/habits.js');
            renderHabits(content, params);
            break;
        case 'settings':
            const { renderSettings } = await import('./src/pages/settings.js');
            renderSettings(content, params);
            break;
    }
};

// Local storage listener for theme
window.addEventListener('theme-changed', (e) => {
    state.theme = e.detail.theme;
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
});

// Event listeners
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);

export { navigate, state };
