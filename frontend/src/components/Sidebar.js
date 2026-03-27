import { navigate } from '../../main.js';

export const renderSidebar = (container, activePage) => {
    const menuItems = [
        { id: 'dashboard', label: 'Tổng quan', icon: 'fas fa-th-large', path: '#/dashboard' },
        { id: 'tasks', label: 'Nhiệm vụ', icon: 'fas fa-list-check', path: '#/tasks' },
        { id: 'planning', label: 'Lập kế hoạch', icon: 'fas fa-calendar-days', path: '#/planning' },
        { id: 'habits', label: 'Thói quen', icon: 'fas fa-repeat', path: '#/habits' },
        { id: 'settings', label: 'Cài đặt', icon: 'fas fa-gear', path: '#/settings' },
    ];

    container.innerHTML = `
        <div class="sidebar-wrapper" style="padding: var(--spacing-lg); display: flex; flex-direction: column; height: 100%;">
            <div class="sidebar-header" style="display: flex; align-items: center; justify-content: center; margin-bottom: var(--spacing-xl); cursor: pointer;" onclick="window.location.hash='#/dashboard'">
                <img src="/logo.png" alt="PlanBee Logo" style="height: 60px; object-fit: contain;">
            </div>
            
            <nav class="sidebar-nav" style="flex: 1;">
                ${menuItems.map(item => `
                    <a href="${item.path}" class="nav-item ${activePage === item.id ? 'active' : ''}" 
                       style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; margin-bottom: 4px; text-decoration: none; color: ${activePage === item.id ? 'white' : 'var(--text-muted)'}; background: ${activePage === item.id ? 'var(--primary-color)' : 'transparent'}; transition: all var(--transition-fast); font-weight: 500;">
                        <i class="${item.icon}" style="width: 20px; text-align: center;"></i>
                        <span>${item.label}</span>
                    </a>
                `).join('')}
            </nav>
            
            <div class="sidebar-footer" style="padding-top: var(--spacing-md); border-top: 1px solid var(--border-color);">
                <button id="logout-btn" style="width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; color: var(--danger); font-weight: 500; font-family: inherit;">
                    <i class="fas fa-sign-out-alt" style="width: 20px; text-align: center;"></i>
                    <span>Đăng xuất</span>
                </button>
            </div>
        </div>
    `;

    // Add hover effects via CSS if not already there, or use JS for simple hover
    const navItems = container.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (!item.classList.contains('active')) {
            item.onmouseenter = () => {
                item.style.background = 'var(--primary-light)';
                item.style.color = 'var(--primary-color)';
            };
            item.onmouseleave = () => {
                item.style.background = 'transparent';
                item.style.color = 'var(--text-muted)';
            };
        }
    });

    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('token');
        navigate('#/');
    };
};
