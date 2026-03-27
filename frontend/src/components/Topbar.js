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
        <div class="topbar-wrapper" style="width: 100%; display: flex; align-items: center; justify-content: space-between; height: 100%; padding: 0 var(--spacing-lg);">
            <div class="topbar-left">
                <h3 id="page-title" style="font-size: 1.4rem; font-weight: 800; color: var(--text-main); margin: 0; letter-spacing: -0.5px;">Tổng quan</h3>
            </div>
            
            <div class="topbar-right" style="display: flex; align-items: center; gap: var(--spacing-md);">
                <!-- Search Box -->
                <div class="search-container" style="position: relative;">
                    <div class="search-box" style="position: relative; transition: all 0.3s ease;">
                        <i class="fas fa-search" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-light); z-index: 10;"></i>
                        <input type="text" id="global-search" placeholder="Tìm kiếm nhiệm vụ, kế hoạch..." 
                            style="padding: 12px 16px 12px 42px; border-radius: 12px; border: 1.5px solid var(--border-color); background: var(--input-bg); width: 320px; outline: none; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-weight: 500; font-size: 0.9rem;">
                    </div>
                    <!-- Search Results Dropdown -->
                    <div id="search-results" class="search-dropdown" style="display: none; position: absolute; top: calc(100% + 12px); left: 0; width: 400px; background: white; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 15px 40px rgba(0,0,0,0.12); z-index: 1000; overflow: hidden; animation: slideDown 0.3s ease;">
                        <div style="padding: 12px 16px; border-bottom: 1px solid var(--border-color); background: #f8f9fa;">
                            <span style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">Kết quả tìm kiếm</span>
                        </div>
                        <div id="search-items-list" style="max-height: 400px; overflow-y: auto;">
                            <!-- Items will be injected here -->
                        </div>
                    </div>
                </div>

                <!-- Theme Toggle -->
                <button id="theme-toggle" class="topbar-icon-btn" title="Chuyển chế độ">
                    <i class="fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}"></i>
                </button>

                <!-- Notifications -->
                <div class="notification-container" style="position: relative;">
                    <button id="notification-btn" class="topbar-icon-btn" style="position: relative;">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge"></span>
                    </button>
                    <!-- Notification Dropdown -->
                    <div class="notification-dropdown">
                        <div class="dropdown-header">
                            <span style="font-weight: 800;">Thông báo</span>
                            <span style="font-size: 0.75rem; color: var(--primary-color); cursor: pointer;">Đánh dấu đã đọc</span>
                        </div>
                        <div class="notification-list">
                            ${notifications.map(noti => `
                                <div class="notification-item">
                                    <div class="noti-icon" style="background: ${noti.color}15; color: ${noti.color};">
                                        <i class="fas ${noti.icon}"></i>
                                    </div>
                                    <div class="noti-content">
                                        <div class="noti-title">${noti.title}</div>
                                        <div class="noti-message">${noti.message}</div>
                                        <div class="noti-time">${noti.time}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="dropdown-footer">
                            Xem tất cả thông báo
                        </div>
                    </div>
                </div>

                <!-- User Profile -->
                <div class="user-profile-wrapper" style="position: relative;">
                    <div id="user-profile" class="user-profile-card">
                        <div class="user-avatar">
                            <img src="/bee.png" alt="Avatar">
                        </div>
                        <div class="user-meta" style="display: flex; flex-direction: column;">
                            <span class="user-name">${userName}</span>
                            <span class="user-role">${userRole}</span>
                        </div>
                        <i class="fas fa-chevron-down" style="font-size: 0.7rem; color: var(--text-muted); margin-left: 8px; transition: transform 0.3s;"></i>
                    </div>
                    <!-- User Dropdown (Optional but professional) -->
                    <div id="user-dropdown" class="user-dropdown-menu">
                        <div style="padding: 16px; border-bottom: 1px solid var(--border-color);">
                            <div style="font-weight: 800; color: var(--text-main);">${userName}</div>
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
            .topbar-icon-btn {
                padding: 12px;
                border-radius: 14px;
                border: 1.5px solid var(--border-color);
                color: var(--text-main);
                font-size: 1.1rem;
                line-height: 1;
                background: var(--card-bg);
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .topbar-icon-btn:hover {
                border-color: var(--primary-color);
                color: var(--primary-color);
                transform: translateY(-2px);
                background: var(--primary-light);
                box-shadow: 0 4px 12px rgba(255,167,38,0.1);
            }
            
            .notification-badge {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 10px;
                height: 10px;
                background: var(--danger);
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 0 2px white;
            }

            .user-profile-card {
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                padding: 6px 14px;
                border-radius: 14px;
                border: 1.5px solid var(--border-color);
                background: var(--card-bg);
                transition: all 0.3s ease;
            }
            .user-profile-card:hover {
                border-color: var(--primary-color);
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            }
            .user-avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: white;
                border: 2px solid var(--primary-color);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                box-shadow: 0 4px 10px rgba(255,167,38,0.2);
            }
            .user-avatar img {
                width: 75%;
                height: 75%;
                object-fit: contain;
            }
            .user-name {
                font-size: 0.9rem;
                font-weight: 800;
                line-height: 1.2;
                color: var(--text-main);
            }
            .user-role {
                font-size: 0.7rem;
                color: var(--text-muted);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Notification Dropdown */
            .notification-container:hover .notification-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }
            .notification-dropdown {
                position: absolute;
                top: calc(100% + 12px);
                right: 0;
                width: 350px;
                background: white;
                border-radius: 20px;
                border: 1px solid var(--border-color);
                box-shadow: 0 15px 40px rgba(0,0,0,0.15);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                overflow: hidden;
            }
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
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
            searchDropdown.style.display = 'none';
        }
    });

    // Fetch real notifications
    const notificationContainer = container.querySelector('.notification-container');
    const notificationList = container.querySelector('.notification-list');
    const notificationBadge = container.querySelector('.notification-badge');
    
    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications/all');
            const notifications = response.notifications || [];
            const unreadCount = notifications.filter(n => !n.is_read).length;

            if (unreadCount > 0) {
                notificationBadge.style.display = 'block';
                notificationBadge.textContent = unreadCount > 9 ? '9+' : unreadCount;
            } else {
                notificationBadge.style.display = 'none';
            }

            if (notifications.length === 0) {
                notificationList.innerHTML = `<div style="padding: 40px 20px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">Bạn không có thông báo nào.</div>`;
            } else {
                notificationList.innerHTML = notifications.slice(0, 5).map(noti => {
                    const date = new Date(noti.created_at);
                    const diff = Math.floor((new Date() - date) / 60000);
                    const timeStr = diff < 60 ? `${diff} phút trước` : (diff < 1440 ? `${Math.floor(diff/60)} giờ trước` : `${Math.floor(diff/1440)} ngày trước`);
                    
                    let icon = 'fa-bell';
                    let color = 'var(--primary-color)';
                    if (noti.message.includes('hoàn thành')) { icon = 'fa-check-circle'; color = 'var(--success)'; }
                    if (noti.message.includes('lập kế hoạch') || noti.message.includes('tạo')) { icon = 'fa-calendar-plus'; color = 'var(--info)'; }

                    return `
                        <div class="notification-item ${noti.is_read ? 'read' : 'unread'}" style="${noti.is_read ? '' : 'background: rgba(255, 167, 38, 0.03);'}">
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

    // Load once and poll every 60s
    loadNotifications();
    setInterval(loadNotifications, 60000);

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
};



