export const renderTopbar = (container) => {
    const theme = localStorage.getItem('theme') || 'light';
    
    container.innerHTML = `
        <div class="topbar-wrapper" style="width: 100%; display: flex; align-items: center; justify-content: space-between; height: 100%;">
            <div class="topbar-left">
                <h3 id="page-title" style="font-size: 1.25rem; font-weight: 700; color: var(--text-main);">Tổng quan</h3>
            </div>
            
            <div class="topbar-right" style="display: flex; align-items: center; gap: var(--spacing-md);">
                <!-- Search (optional, good for UI) -->
                <div class="search-box" style="position: relative;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light);"></i>
                    <input type="text" placeholder="Tìm kiếm nhiệm vụ..." style="padding: 10px 12px 10px 36px; border-radius: 8px; border: 1px solid var(--border-color); background: var(--input-bg); width: 250px; outline: none; transition: border var(--transition-fast);">
                </div>

                <!-- Theme Toggle -->
                <button id="theme-toggle" style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-size: 1.1rem; line-height: 1;">
                    <i class="fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                </button>

                <!-- Notifications -->
                <div class="notification-wrapper" style="position: relative; cursor: pointer;">
                    <button style="padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); color: var(--text-main); font-size: 1.1rem; line-height: 1;">
                        <i class="fas fa-bell"></i>
                    </button>
                    <span style="position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; background: var(--danger); border-radius: 50%; border: 2px solid var(--header-bg);"></span>
                </div>

                <!-- User Profile -->
                <div class="user-profile" style="display: flex; align-items: center; gap: var(--spacing-sm); cursor: pointer; padding: 6px 12px; border-radius: 12px; border: 1px solid var(--border-color);">
                    <div class="user-avatar" style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white;">
                        <i class="fas fa-user"></i>
                    </div>
                    <div class="user-info" style="display: flex; flex-direction: column;">
                        <span style="font-size: 0.9rem; font-weight: 600; line-height: 1.2;">Admin User</span>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">Admin</span>
                    </div>
                    <i class="fas fa-chevron-down" style="font-size: 0.75rem; color: var(--text-muted); margin-left: 4px;"></i>
                </div>
            </div>
        </div>
    `;

    // Update page title based on hash
    const updateTitle = () => {
        const hash = window.location.hash || '#/dashboard';
        const titles = {
            '#/dashboard': 'Tổng quan',
            '#/tasks': 'Nhiệm vụ',
            '#/planning': 'Lập kế hoạch',
            '#/habits': 'Thói quen',
            '#/settings': 'Cài đặt'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = titles[hash] || 'PlanBee';
    };
    updateTitle();
    window.addEventListener('hashchange', updateTitle);

    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.onclick = () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        window.dispatchEvent(new CustomEvent('theme-changed', { 
            detail: { theme: nextTheme } 
        }));
        
        // Update icon
        const icon = themeBtn.querySelector('i');
        icon.className = `fas ${nextTheme === 'light' ? 'fa-moon' : 'fa-sun'}`;
    };
};
