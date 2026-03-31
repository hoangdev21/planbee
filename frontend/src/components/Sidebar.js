import { navigate } from '../../main.js';

export const renderSidebar = (container, activePage) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.username || localStorage.getItem('user_name') || 'Người dùng';
    
    let menuItems = [];
    const isAdminMode = activePage.startsWith('admin');

    if (isAdminMode) {
        menuItems = [
            { id: 'admin-dashboard', label: 'Dashboard', icon: 'fas fa-chart-pie', path: '#/admin' },
            { id: 'admin-users', label: 'Quản lý người dùng', icon: 'fas fa-users-gear', path: '#/admin/users' },
            { id: 'admin-ai', label: 'Giám sát & Điều phối AI', icon: 'fas fa-shield-halved', path: '#/admin/ai' },
            { id: 'admin-stats', label: 'Thống kê hiệu suất', icon: 'fas fa-chart-line', path: '#/admin/stats' },
            { id: 'admin-notifications', label: 'Quản lý thông báo', icon: 'fas fa-bullhorn', path: '#/admin/notifications' },
            { id: 'back-to-user', label: 'Về Website', icon: 'fas fa-arrow-left-long', path: '#/dashboard' },
        ];
    } else {
        menuItems = [
            { id: 'dashboard', label: 'Tổng quan', icon: 'fas fa-th-large', path: '#/dashboard' },
            { id: 'tasks', label: 'Nhiệm vụ', icon: 'fas fa-list-check', path: '#/tasks' },
            { id: 'planning', label: 'Lập kế hoạch', icon: 'fas fa-calendar-days', path: '#/planning' },
            { id: 'habits', label: 'Thói quen', icon: 'fas fa-repeat', path: '#/habits' },
            { id: 'settings', label: 'Cài đặt', icon: 'fas fa-gear', path: '#/settings' },
        ];
        if (user.role === 'admin') {
            menuItems.push({ id: 'admin', label: 'Admin Panel', icon: 'fas fa-user-shield', path: '#/admin' });
        }
    }

    const accountType = (user.account_type || 'Free').toUpperCase() + ' PLAN';

    container.innerHTML = `
        <div class="sidebar-wrapper" style="padding: var(--spacing-lg); display: flex; flex-direction: column; height: 100%;">
            <div class="sidebar-header" style="display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-xl); cursor: pointer;" onclick="window.location.hash='#/dashboard'">
                <img src="/logo.png" alt="PlanBee Logo" style="height: 60px; object-fit: contain;">
            </div>
            
            <nav class="sidebar-nav" style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
                ${menuItems.map(item => `
                    <a href="${item.path}" class="nav-item ${activePage === item.id ? 'active' : ''}" 
                       style="display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 14px; text-decoration: none; color: ${activePage === item.id ? 'white' : 'var(--text-muted)'}; background: ${activePage === item.id ? 'var(--primary-color)' : 'transparent'}; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 700; font-size: 0.95rem; box-shadow: ${activePage === item.id ? '0 8px 20px rgba(255,167,38,0.25)' : 'none'}; border: 1px solid ${activePage === item.id ? 'rgba(255,167,38,0.2)' : 'transparent'};">
                        <i class="${item.icon}" style="width: 22px; text-align: center; font-size: 1.1rem;"></i>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>
            
            <div class="sidebar-footer" style="padding: 24px; border-top: 1px solid var(--border-color); background: var(--card-bg); margin: 0 -24px -24px -24px; border-radius: 0 0 0 24px;">
                <div class="user-profile-summary" style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 14px; background: rgba(255,167,38,0.04); border-radius: 16px; border: 1.5px solid rgba(255,167,38,0.1); transition: all 0.3s ease;">
                    <div style="width: 48px; height: 48px; border-radius: 50%; background: white; border: 2px solid var(--primary-color); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 4px 12px rgba(255,167,38,0.2); transition: all 0.3s ease;">
                        <img src="/bee.png" alt="User Avatar" style="width: 75%; height: 75%; object-fit: contain;">
                    </div>
                    <div style="flex: 1; overflow: hidden;">
                        <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${userName}</div>
                        <div style="font-size: 0.7rem; font-weight: 700; color: var(--primary-color); text-transform: uppercase; letter-spacing: 0.5px;">${accountType}</div>
                    </div>
                </div>
                <button id="logout-btn" style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 12px; padding: 14px; border-radius: 14px; color: var(--danger); font-weight: 800; font-family: inherit; background: rgba(214, 48, 49, 0.05); border: 1.5px solid rgba(214, 48, 49, 0.1); cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                    <i class="fas fa-sign-out-alt" style="font-size: 1rem;"></i>
                    <span style="font-size: 0.85rem; letter-spacing: 0.08em; font-weight: 800;">ĐĂNG XUẤT</span>
                </button>
            </div>
        </div>
        <style>
            #logout-btn:hover { 
                background: var(--danger); 
                color: white; 
                transform: translateY(-3px); 
                box-shadow: 0 8px 20px rgba(214, 48, 49, 0.25); 
                border-color: var(--danger);
            }
            #logout-btn:active { transform: translateY(-1px); }
            
            .user-profile-summary:hover { 
                border-color: var(--primary-color); 
                transform: translateY(-2px); 
                box-shadow: 0 4px 15px rgba(0,0,0,0.05); 
                cursor: pointer; 
                background: white;
            }
            
            .nav-item:not(.active):hover {
                background: rgba(255,167,38,0.08) !important;
                color: var(--primary-color) !important;
                transform: translateX(5px);
                border-color: rgba(255,167,38,0.1);
            }
        </style>
    `;

    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('#/login');
    };
};

