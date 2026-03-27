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
    
    // Auth check (mock for now)
    const isAuthRequired = !['#/', '#/login', '#/register'].includes(hash);
    const isLoggedIn = !!localStorage.getItem('token');
    
    if (isAuthRequired && !isLoggedIn) {
        navigate('#/login');
        return;
    }

    // Clean up current view
    app.innerHTML = '<div class="loader">Loading...</div>';

    // Route Mapping
    switch (hash) {
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
            renderAppShell(app, 'dashboard');
            break;
        case '#/tasks':
            renderAppShell(app, 'tasks');
            break;
        case '#/planning':
            renderAppShell(app, 'planning');
            break;
        case '#/habits':
            renderAppShell(app, 'habits');
            break;
        case '#/settings':
            renderAppShell(app, 'settings');
            break;
        default:
            app.innerHTML = '<h1>404 Not Found</h1>';
    }
};

// App Shell Renderer (Sidebar + Topbar + Content)
const renderAppShell = async (container, activePage) => {
    // Basic sidebar and topbar HTML
    container.innerHTML = `
        <div class="layout-container">
            <aside id="sidebar"></aside>
            <div class="main-content">
                <header id="topbar"></header>
                <main id="page-content" class="fade-in"></main>
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
            renderDashboard(content);
            break;
        case 'tasks':
            const { renderTasks } = await import('./src/pages/tasks.js');
            renderTasks(content);
            break;
        case 'planning':
            const { renderPlanning } = await import('./src/pages/planning.js');
            renderPlanning(content);
            break;
        case 'habits':
            const { renderHabits } = await import('./src/pages/habits.js');
            renderHabits(content);
            break;
        case 'settings':
            const { renderSettings } = await import('./src/pages/settings.js');
            renderSettings(content);
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
