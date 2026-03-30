import api from '../utils/api.js';

export const renderTopbar = (container) => {
    const theme = localStorage.getItem('theme') || 'light';
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = user.username || localStorage.getItem('user_name') || 'Người dùng';
    const userRole = user.role === 'admin' ? 'Quản trị viên' : 'Thành viên';
    
    // Mock notifications for real feel
    const notifications = [
        { id: 1, title: 'Nhiệm vụ hoàn thành', message: 'Bạn đã hoàn thành nhiệm vụ "Thiết kế UI".', time: '2 phút trước', icon: 'fa-check-circle', color: 'var(--success)' },
        { id: 2, title: 'Lập kế hoạch thành công', message: 'Kế hoạch "Tuần mới" đã được tạo.', time: '1 giờ trước', icon: 'fa-calendar-check', color: 'var(--info)' },
        { id: 3, title: 'Nhắc nhở thói quen', message: 'Đến lúc "Uống nước" rồi bạn ơi!', time: '3 giờ trước', icon: 'fa-clock', color: 'var(--warning)' }
    ];

    container.innerHTML = `
        <div class="topbar-wrapper" style="width: 100%; display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 16px;">
            <div class="topbar-left" style="display: flex; align-items: center; gap: 12px;">
                <button id="mobile-menu-btn" class="mobile-menu-btn-minimal">
                    <i class="fas fa-bars-staggered"></i>
                </button>
                <h3 id="page-title" style="font-size: 1.1rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.3px;">Tổng quan</h3>
            </div>
            
            <div class="topbar-right" style="display: flex; align-items: center; gap: 8px;">
                <!-- Search Box (Minimalist) -->
                <div class="search-container" style="position: relative; margin-right: 8px;">
                    <input type="text" id="global-search" placeholder="Tìm kiếm..." 
                        style="padding: 8px 12px 8px 36px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); width: 220px; outline: none; transition: all 0.3s; font-size: 0.85rem; font-weight: 600;">
                    <i class="fas fa-search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-light); font-size: 0.8rem;"></i>
                </div>

                <!-- Action Group -->
                <div style="display: flex; align-items: center; gap: 6px; padding: 4px; background: rgba(0,0,0,0.02); border-radius: 12px;">
                    <button id="theme-toggle" class="topbar-icon-btn-minimal" title="Chế độ">
                        <i class="fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                    </button>

                    <div class="notification-container" style="position: relative;">
                        <button id="notification-btn" class="topbar-icon-btn-minimal">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge-minimal" style="display: none;"></span>
                        </button>
                        <!-- Notification Dropdown -->
                        <div id="notification-dropdown" class="notification-dropdown">
                            <div class="dropdown-header">
                                <span style="font-weight: 800;">Thông báo</span>
                                <span id="mark-read-all" style="font-size: 0.75rem; color: var(--primary-color); cursor: pointer;">Đánh dấu đã đọc</span>
                            </div>
                            <div class="notification-list">
                                <!-- Real notifications injected here -->
                            </div>
                            <div class="dropdown-footer" id="view-all-notifications">
                                Xem tất cả thông báo
                            </div>
                        </div>
                    </div>
                </div>

                <!-- User Profile (Compact) -->
                <div class="user-profile-wrapper" style="position: relative; margin-left: 4px;">
                    <div id="user-profile" class="user-profile-compact">
                        <div class="user-avatar-mini">
                            <img src="/bee.png" alt="Avatar">
                        </div>
                        <i class="fas fa-chevron-down" style="font-size: 0.6rem; color: var(--text-muted); opacity: 0.5;"></i>
                    </div>
                    <!-- User Dropdown Menu -->
                    <div id="user-dropdown" class="user-dropdown-menu">
                        <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                            <div style="font-weight: 800; color: var(--text-main);" id="dropdown-user-name">${userName}</div>
                            <div style="font-size: 0.8rem; color: var(--text-muted);">${user.email || 'user@planbee.com'}</div>
                        </div>
                        <a href="#/settings" class="dropdown-link"><i class="fas fa-user-gear"></i> Tài khoản</a>
                        <a href="#/settings" class="dropdown-link"><i class="fas fa-shield-halved"></i> Bảo mật</a>
                        <div style="padding: 8px; border-top: 1px solid var(--border-color);">
                            <button id="topbar-logout" style="width: 100%; padding: 10px; text-align: left; background: none; border: none; color: var(--danger); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 10px; border-radius: 8px; transition: background 0.2s;">
                                <i class="fas fa-power-off"></i> Đăng xuất
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .mobile-menu-btn-minimal {
                width: 36px; height: 36px; border-radius: 10px; border: none;
                background: #f1f2f6; color: var(--text-main); cursor: pointer;
                display: flex; align-items: center; justify-content: center;
            }

            .topbar-icon-btn-minimal {
                width: 34px; height: 34px; border-radius: 8px; border: none;
                background: transparent; color: var(--text-main); cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: all 0.2s; font-size: 1rem; position: relative;
            }
            .topbar-icon-btn-minimal:hover { background: white; box-shadow: var(--shadow-sm); color: var(--primary-color); }

            .notification-badge-minimal {
                position: absolute; top: -2px; right: -4px; 
                background: #ff4757; color: white; border-radius: 50%; 
                border: 2px solid white; box-shadow: 0 2px 6px rgba(255, 71, 87, 0.3);
                font-size: 0.62rem; font-weight: 800;
                min-width: 18px; height: 18px;
                display: flex; align-items: center; justify-content: center;
                padding: 0 4px; z-index: 10;
            }

            .user-profile-compact {
                display: flex; align-items: center; gap: 6px; cursor: pointer;
                padding: 2px; border-radius: 50px; transition: all 0.2s;
            }
            .user-profile-compact:hover { background: rgba(0,0,0,0.03); }
            
            .user-avatar-mini {
                width: 32px; height: 32px; border-radius: 50%; border: 1.5px solid var(--primary-color);
                background: white; overflow: hidden; display: flex; align-items: center; justify-content: center;
            }
            .user-avatar-mini img { width: 70%; height: 70%; object-fit: contain; }

            /* Dropdowns */
            .notification-dropdown, .user-dropdown-menu {
                position: absolute; top: calc(100% + 10px); right: 0; 
                background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-color);
                box-shadow: 0 10px 40px rgba(0,0,0,0.1); z-index: 1000; display: none;
                overflow: hidden; animation: slideInTop 0.2s ease-out;
            }
            .notification-dropdown { width: 320px; }
            .user-dropdown-menu { width: 220px; }
            
            .notification-dropdown.active, .user-dropdown-menu.active { display: block; }

            @keyframes slideInTop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .dropdown-header { padding: 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
            .notification-list { max-height: 380px; overflow-y: auto; }
            .notification-item { display: flex; gap: 12px; padding: 12px 16px; border-bottom: 1px solid rgba(0,0,0,0.03); cursor: pointer; transition: background 0.2s; }
            .notification-item:hover { background: rgba(0,0,0,0.02); }
            .noti-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 1rem; }
            .noti-content { display: flex; flex-direction: column; gap: 3px; overflow: hidden; }
            .noti-title { font-weight: 700; font-size: 0.85rem; color: var(--text-main); }
            .noti-time { font-size: 0.7rem; color: var(--text-light); }
            .dropdown-footer { padding: 12px; text-align: center; font-size: 0.8rem; font-weight: 800; color: var(--primary-color); background: rgba(0,0,0,0.01); cursor: pointer; }
            .dropdown-link { display: flex; align-items: center; gap: 10px; padding: 10px 16px; color: var(--text-main); text-decoration: none; font-size: 0.9rem; font-weight: 600; }
            .dropdown-link:hover { background: rgba(0,0,0,0.03); color: var(--primary-color); }
            .dropdown-link i { width: 16px; opacity: 0.6; }
            .dropdown-header {
                padding: 16px 20px;
                border-bottom: 1px solid var(--border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .notification-list {
                max-height: 400px;
                overflow-y: auto;
            }
            .notification-item {
                display: flex;
                gap: 14px;
                padding: 16px 20px;
                transition: background 0.2s;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
            }
            .notification-item:hover { background: #f8f9fa; }
            .noti-icon {
                width: 42px;
                height: 42px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
                font-size: 1.2rem;
            }
            .noti-content { display: flex; flex-direction: column; gap: 4px; }
            .noti-title { font-weight: 800; color: var(--text-main); font-size: 0.9rem; }
            .noti-message { font-size: 0.85rem; color: var(--text-muted); line-height: 1.4; }
            .noti-time { font-size: 0.75rem; color: var(--text-light); margin-top: 2px; }
            .dropdown-footer {
                padding: 14px;
                text-align: center;
                font-weight: 800;
                font-size: 0.85rem;
                color: var(--primary-color);
                background: #f8f9fa;
                cursor: pointer;
            }

            /* User Dropdown */
            .user-dropdown-menu {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                width: 240px;
                background: white;
                border-radius: 16px;
                border: 1px solid var(--border-color);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
                z-index: 1000;
                overflow: hidden;
            }
            .user-profile-wrapper:hover .user-dropdown-menu {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            .dropdown-link {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 12px 16px;
                color: var(--text-main);
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9rem;
                transition: all 0.2s;
            }
            .dropdown-link:hover { background: #f8f9fa; color: var(--primary-color); }
            .dropdown-link i { width: 18px; color: var(--text-muted); }

            /* Search styles */
            #global-search:focus {
                width: 400px;
                border-color: var(--primary-color);
                box-shadow: 0 0 0 4px rgba(255,167,38,0.1);
            }
            .search-item {
                display: flex;
                padding: 12px 16px;
                gap: 12px;
                cursor: pointer;
                transition: background 0.2s;
                border-bottom: 1px solid #f0f0f0;
            }
            .search-item:hover { background: #f8f9fa; }
            .search-item-info { display: flex; flex-direction: column; overflow: hidden; }
            .search-item-title { font-weight: 700; color: var(--text-main); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .search-item-meta { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }

            @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        </style>
    `;

    // 1. Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    const updateThemeIcon = (theme) => {
        const icon = themeBtn.querySelector('i');
        icon.className = `fas ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`;
    };

    themeBtn.onclick = async () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        try {
            await api.put('/auth/settings/update', { theme: nextTheme });
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: nextTheme } }));
            updateThemeIcon(nextTheme);
        } catch (err) {
            console.error('Failed to update theme preference:', err);
        }
    };

    // Sync with external changes (e.g. from Settings page)
    window.addEventListener('theme-changed', (e) => {
        updateThemeIcon(e.detail.theme);
    });

    // 2. Global Search Logic
    const searchInput = document.getElementById('global-search');
    const searchDropdown = document.getElementById('search-results');
    const searchList = document.getElementById('search-items-list');
    let allData = { tasks: [], plans: [] };
    let isDataLoaded = false;

    const loadSearchData = async () => {
        if (isDataLoaded) return;
        try {
            const [tasksRes, plansRes] = await Promise.all([
                api.get('/tasks/all'),
                api.get('/plans/all')
            ]);
            allData.tasks = tasksRes.tasks || [];
            allData.plans = plansRes.plans || [];
            isDataLoaded = true;
        } catch (err) { console.error('Load search data failed:', err); }
    };

    searchInput.addEventListener('focus', loadSearchData);
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        if (!query) {
            searchDropdown.style.display = 'none';
            return;
        }

        const filteredTasks = allData.tasks.filter(t => t.title.toLowerCase().includes(query) || (t.description && t.description.toLowerCase().includes(query)));
        const filteredPlans = allData.plans.filter(p => p.title.toLowerCase().includes(query) || (p.description && p.description.toLowerCase().includes(query)));

        const results = [
            ...filteredTasks.map(t => ({ ...t, type: 'Nhiệm vụ', icon: 'fa-check-double', color: '#6c5ce7' })),
            ...filteredPlans.map(p => ({ ...p, type: 'Kế hoạch', icon: 'fa-calendar-alt', color: 'var(--info)' }))
        ];

        if (results.length === 0) {
            searchList.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">Không tìm thấy kết quả cho "<b>${query}</b>"</div>`;
        } else {
            searchList.innerHTML = results.map(item => `
                <div class="search-item" onclick="window.location.hash='#/tasks'">
                    <div style="width: 38px; height: 38px; border-radius: 10px; background: ${item.color}15; color: ${item.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div class="search-item-info">
                        <div class="search-item-title">${item.title}</div>
                        <div class="search-item-meta">${item.type} • ${item.due_date || item.start_time || 'Đang diễn ra'}</div>
                    </div>
                </div>
            `).join('');
        }
        searchDropdown.style.display = 'block';
    });

    // Close search on click outside
    document.addEventListener('click', (e) => {
        if (searchInput && searchDropdown && !searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    // Fetch real notifications
    const notificationContainer = container.querySelector('.notification-container');
    const notificationList = container.querySelector('.notification-list');
    const notificationBadge = container.querySelector('.notification-badge-minimal');
    
    // Polling and Notification API Support
    let lastUnreadCount = 0;

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            if (Notification.permission === 'default') {
                await Notification.requestPermission();
            }
        }
    };

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications/all');
            const notifications = response.notifications || [];
            const unreadItems = notifications.filter(n => !n.is_read);
            const unreadCount = unreadItems.length;

            if (unreadCount > 0) {
                notificationBadge.style.display = 'flex';
                notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
                
                // If count increased, show system notification
                if (unreadCount > lastUnreadCount && Notification.permission === 'granted') {
                    const latest = unreadItems[0];
                    new Notification('PlanBee 🐝', {
                        body: latest.message,
                        icon: '/bee.png'
                    });
                }
            } else {
                notificationBadge.style.display = 'none';
            }
            lastUnreadCount = unreadCount;

            if (notifications.length === 0) {
                notificationList.innerHTML = `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Bạn không có thông báo nào.</div>`;
            } else {
                notificationList.innerHTML = notifications.slice(0, 10).map(noti => {
                    const date = new Date(noti.created_at);
                    const diff = Math.floor((new Date() - date) / 60000);
                    const timeStr = diff < 60 ? `${diff} phút trước` : (diff < 1440 ? `${Math.floor(diff/60)} giờ trước` : `${Math.floor(diff/1440)} ngày trước`);
                    
                    let icon = 'fa-bell';
                    let color = 'var(--primary-color)';
                    if (noti.message.includes('hoàn thành')) { icon = 'fa-check-circle'; color = 'var(--success)'; }
                    if (noti.message.includes('lập kế hoạch') || noti.message.includes('tạo')) { icon = 'fa-calendar-plus'; color = 'var(--info)'; }

                    const targetPath = noti.type === 'plan' ? `#/planning?id=${noti.target_id}` : (noti.type === 'task' ? `#/tasks?id=${noti.target_id}` : null);

                    return `
                        <div class="notification-item ${noti.is_read ? 'read' : 'unread'}" 
                             style="${noti.is_read ? '' : 'background: rgba(255, 167, 38, 0.03);'}"
                             onclick="${targetPath ? `window.location.hash='${targetPath}'` : ''}">
                            <div class="noti-icon" style="background: ${color}15; color: ${color};">
                                <i class="fas ${icon}"></i>
                            </div>
                            <div class="noti-content">
                                <div class="noti-title" style="font-weight: ${noti.is_read ? '650' : '800'};">${noti.message}</div>
                                <div class="noti-time">${timeStr}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        } catch (err) { console.error('Fetch notifications failed:', err); }
    };

    // Load once and poll
    requestNotificationPermission();
    loadNotifications();
    setInterval(loadNotifications, 15000); // Polling every 15s for more "real-time" feel

    // Mark as read logic
    const markReadBtn = container.querySelector('.dropdown-header span:last-child');
    if (markReadBtn) {
        markReadBtn.onclick = async () => {
            try {
                await api.put('/notifications/mark-as-read');
                loadNotifications();
            } catch (err) { console.error(err); }
        };
    }

    // View all link
    const viewAllBtn = container.querySelector('.dropdown-footer');
    if (viewAllBtn) {
        viewAllBtn.onclick = () => {
            window.location.hash = '#/settings?tab=notifications';
        };
    }

    // 3. Page Title Sync
    const updateTitle = () => {
        const hash = window.location.hash || '#/dashboard';
        const titles = { 
            '#/dashboard': 'Tổng quan', 
            '#/tasks': 'Nhiệm vụ', 
            '#/planning': 'Lập kế hoạch', 
            '#/habits': 'Thói quen', 
            '#/settings': 'Cài đặt',
            '#/notifications': 'Thông báo'
        };
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.innerText = titles[hash] || 'PlanBee';
    };
    updateTitle();
    window.addEventListener('hashchange', updateTitle);

    // 4. Logout Logic
    const logoutBtn = document.getElementById('topbar-logout');
    if (logoutBtn) {
        logoutBtn.onclick = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.hash = '#/login';
        };
    }

    // 5. Dropdown Toggle Logic (Click-based for mobile/reliability)
    const notiBtn = document.getElementById('notification-btn');
    const notiDropdown = document.getElementById('notification-dropdown');
    const userProfile = document.getElementById('user-profile');
    const userDropdown = document.getElementById('user-dropdown');

    if (notiBtn && notiDropdown) {
        notiBtn.onclick = (e) => {
            e.stopPropagation();
            notiDropdown.classList.toggle('active');
            if (userDropdown) userDropdown.classList.remove('active');
        };
    }

    if (userProfile && userDropdown) {
        userProfile.onclick = (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('active');
            if (notiDropdown) notiDropdown.classList.remove('active');
        };
    }

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (notiDropdown && !notiBtn.contains(e.target) && !notiDropdown.contains(e.target)) {
            notiDropdown.classList.remove('active');
        }
        if (userDropdown && !userProfile.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    // 6. Mobile Menu Toggle Logic
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    const drawerOverlay = document.getElementById('drawer-overlay');

    if (mobileMenuBtn) {
        mobileMenuBtn.onclick = () => {
            if (sidebar) sidebar.classList.add('active');
            if (drawerOverlay) drawerOverlay.classList.add('active');
        };
    }
};

/* Additional Responsive Styles for Topbar */
const style = document.createElement('style');
style.textContent = `
    @media (max-width: 768px) {
        .search-container {
            display: none !important; /* Hide search on mobile for clarity */
        }
        .user-meta {
            display: none !important;
        }
        .user-profile-card {
            padding: 4px !important;
            border: none !important;
            background: transparent !important;
        }
        #page-title {
            font-size: 1.1rem !important;
        }
    }
`;
document.head.appendChild(style);



