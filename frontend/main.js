import './style.css';
import './src/styles/design-system.css';
import { initChatWidget } from './src/components/ChatWidget.js';

/* 🛡️ PRO-LEVEL SECURITY: ANTI-DEVTOOLS SYSTEM */
/* 🛡️ PRO-LEVEL SECURITY: ANTI-DEVTOOLS SYSTEM */
const initSecurity = () => {
    // Only lock down on production (e.g. Vercel, Render)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) return; // Do not block development locally

    // 1. Block Keyboard Shortcuts & Source View
    document.addEventListener('keydown', (e) => {
        if (
            e.key === 'F12' || e.keyCode === 123 ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
            (e.metaKey && e.altKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
            (e.ctrlKey && e.key === 'U') || (e.metaKey && e.key === 'U') 
        ) {
            e.preventDefault();
            return false;
        }
    });

    // 2. Disable Context Menu
    document.addEventListener('contextmenu', e => e.preventDefault());

    // 3. Graceful DevTools Detection (No freezing debugger)
    const triggerLockdown = () => {
        document.body.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:#050505;z-index:9999999;display:flex;align-items:center;justify-content:center;font-family:system-ui, sans-serif;">
                <div style="text-align:center;max-width:600px;padding:40px;">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" style="margin-bottom: 24px; display:inline-block;">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <h1 style="font-size: 2.2rem; color: #f8fafc; margin-bottom: 16px; font-weight:800; letter-spacing:-0.5px;">Phát Hiện Sự Cố Bảo Mật</h1>
                    <p style="font-size: 1.1rem; color: #94a3b8; line-height: 1.6;">Hành vi can thiệp DevTools hoặc truy cập mã nguồn đã bị chặn.<br><br><span style="color:#ef4444;font-weight:700;">Vui lòng TẮT hoàn toàn Developer Tools và F5 tải lại trang để tiếp tục trải nghiệm website.</span></p>
                </div>
            </div>
        `;
        document.head.innerHTML = ''; // Wipe CSS and styles
        document.documentElement.style.overflow = 'hidden';
        window.stop();
    };

    // Heuristic 1: Detect Window Size difference (Catches Docked DevTools instantly)
    const detectDocked = () => {
        const threshold = 160;
        if ((window.outerWidth - window.innerWidth > threshold) || 
            (window.outerHeight - window.innerHeight > threshold)) {
            triggerLockdown();
        }
    };
    window.addEventListener('resize', detectDocked);

    // Heuristic 2: Detect Element Lazy Evaluation (Catches Undocked DevTools)
    const devtoolsDetector = new Image();
    Object.defineProperty(devtoolsDetector, 'id', {
        get: function () {
            triggerLockdown();
            throw new Error("DevTools Active");
        }
    });

    setInterval(() => {
        detectDocked();
        console.log('%c', devtoolsDetector);
        console.clear(); 
    }, 1000);
};
initSecurity();

// State management (simple)
const state = {
    user: null, // Logged in user info
    theme: localStorage.getItem('theme') || 'light',
    accent_color: localStorage.getItem('accent_color') || '#FFA726',
    notifications: [],
};

// Initialize theme & color
document.documentElement.setAttribute('data-theme', state.theme);
document.documentElement.style.setProperty('--primary-color', state.accent_color);

// Initialize Chat Bot (Condition is handled in handleRoute)
// initChatWidget();

// Router Function
const navigate = (path) => {
    window.location.hash = path;
};

const handleRoute = async () => {
    // initChatWidget(); // Re-init on route - now handled by route checks below
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');
    
    // Parse query params from hash: #/page?param=value
    const [path, queryStr] = hash.split('?');
    const params = Object.fromEntries(new URLSearchParams(queryStr || ''));

    // Auth check (mock for now)
    const isAuthRequired = !['#/', '#/login', '#/register'].includes(path);
    const token = localStorage.getItem('token');
    const isLoggedIn = !!token && token !== 'undefined' && token !== 'null';

    
    // Manage chat widget visibility based on auth state and route
    const isLanding = path === '#/' || path === '' || path === '#';
    if (isLanding && !isLoggedIn) {
        const existingWidget = document.getElementById('bee-chat-widget');
        if (existingWidget) {
            existingWidget.remove();
            console.log('PlanBee: ChatWidget removed from landing page (Guest)');
        }
    } else if (isLoggedIn) {
        initChatWidget();
    } else {
        // Safe removal for any other guest routes
        const existingWidget = document.getElementById('bee-chat-widget');
        if (existingWidget) existingWidget.remove();
    }

    
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
        case '#/admin':
        case '#/admin/users':
        case '#/admin/ai':
        case '#/admin/stats':
        case '#/admin/notifications':
            const subPage = path.split('/')[2] || 'dashboard'; // admin, users, ai...
            renderAppShell(app, `admin-${subPage}`, params);
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
            <div class="drawer-overlay" id="drawer-overlay"></div>
            <aside id="sidebar"></aside>
            <div class="main-content" style="display: flex; flex-direction: column; min-height: 125vh;">
                <header id="topbar"></header>
                <main id="page-content" class="fade-in" style="flex: 1;"></main>
                <footer class="app-footer" style="padding: 12px 24px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); font-size: 0.725rem; color: var(--text-muted); font-weight: 500; transition: all 0.3s ease;">
                    <div class="footer-left">© 2026 <span style="color: var(--primary-color); font-weight: 700;">PlanBee</span> • Tăng cường hiệu suất 🚀</div>
                    <div class="footer-right" style="display: flex; gap: 16px; align-items: center;">
                        <div style="display: flex; align-items: center; gap: 6px; padding: 4px 10px; background: rgba(0, 184, 148, 0.05); border-radius: 20px; border: 1px solid rgba(0, 184, 148, 0.1);">
                            <span style="position: relative; width: 6px; height: 6px; background: var(--success); border-radius: 50%; display: inline-block;">
                                <span style="position: absolute; inset: 0; background: var(--success); border-radius: 50%; animation: ping 1.5s infinite; opacity: 0.6;"></span>
                            </span>
                            <span style="color: var(--success); font-weight: 800; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Ổn định</span>
                        </div>
                        <span style="opacity: 0.5; font-weight: 700; letter-spacing: 0.5px;">v1.2.0</span>
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

    // Handle Mobile Menu Logic
    const drawerOverlay = document.getElementById('drawer-overlay');
    const sidebar = document.getElementById('sidebar');

    drawerOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        drawerOverlay.classList.remove('active');
    });

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
        default:
            if (activePage.startsWith('admin-')) {
                const { renderAdminDashboard } = await import('./src/pages/AdminDashboard.js');
                renderAdminDashboard(content, activePage, params);
            }
            break;
    }
};

// Local storage listener for theme
window.addEventListener('theme-changed', (e) => {
    state.theme = e.detail.theme;
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
});

window.addEventListener('accent-color-changed', (e) => {
    state.accent_color = e.detail.color;
    document.documentElement.style.setProperty('--primary-color', state.accent_color);
    localStorage.setItem('accent_color', state.accent_color);
});

// Event listeners
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute);

export { navigate, state };
