import api from '../utils/api.js';

export const renderSettings = async (container) => {
    let activeTab = 'personal';
    
    // Check if hash has a specific tab via query-like param
    const currentHash = window.location.hash;
    if (currentHash.includes('tab=notifications')) {
        activeTab = 'notifications';
    }

    let userData = null;
    let userSettings = null;
    let notifications = [];

    const loadData = async () => {
        try {
            const [profileRes, notiRes] = await Promise.all([
                api.get('/auth/profile'),
                api.get('/notifications/all')
            ]);
            userData = profileRes.user;
            userSettings = profileRes.settings;
            notifications = notiRes.notifications || [];
        } catch (err) {
            console.error(err);
        }
    };

    await loadData();

    const render = () => {
        container.innerHTML = `
            <div class="settings-root fade-in" style="padding: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px;">
                    <div>
                        <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">Cài đặt hệ thống</h2>
                        <p style="color: var(--text-muted); font-weight: 500;">Quản lý tài khoản, thông báo và cấu hình cá nhân.</p>
                    </div>
                </div>

                <div class="settings-layout">
                    <!-- Sidebar Menu -->
                    <div class="settings-sidebar">
                        <div class="settings-menu-card">
                            ${['personal', 'password', 'notifications', 'appearance', 'security'].map(tab => {
                                const labels = { 
                                    personal: 'Thông tin cá nhân', 
                                    password: 'Đổi mật khẩu', 
                                    notifications: 'Thông báo', 
                                    appearance: 'Giao diện & Chủ đề', 
                                    security: 'Bảo mật & Quyền riêng tư' 
                                };
                                const icons = {
                                    personal: 'fa-user',
                                    password: 'fa-lock',
                                    notifications: 'fa-bell',
                                    appearance: 'fa-palette',
                                    security: 'fa-shield-halved'
                                };
                                const unreadCount = notifications.filter(n => !n.is_read).length;
                                return `
                                    <button class="settings-nav-item ${activeTab === tab ? 'active' : ''}" data-tab="${tab}">
                                        <i class="fas ${icons[tab]}"></i>
                                        <span>${labels[tab]}</span>
                                        ${tab === 'notifications' && unreadCount > 0 ? `<span class="noti-dot-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                                <button class="settings-nav-item danger" style="color: var(--danger);">
                                    <i class="fas fa-trash-can"></i>
                                    <span>Xóa tài khoản</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content Panel -->
                    <div class="settings-panel">
                        <div class="settings-card shadow-premium">
                            ${renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .settings-layout { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }
                
                .settings-menu-card {
                    background: var(--card-bg);
                    border-radius: 20px;
                    border: 1.5px solid var(--border-color);
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    box-shadow: var(--shadow-sm);
                    position: sticky;
                    top: 24px;
                }
                
                .settings-nav-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 14px 18px;
                    border-radius: 14px;
                    border: none;
                    background: transparent;
                    color: var(--text-muted);
                    font-weight: 700;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    text-align: left;
                    position: relative;
                }
                
                .settings-nav-item:hover { background: var(--primary-light); color: var(--primary-color); transform: translateX(5px); }
                .settings-nav-item.active { background: var(--primary-light); color: var(--primary-color); }
                .settings-nav-item i { width: 22px; font-size: 1.1rem; text-align: center; }

                .noti-dot-badge {
                    position: absolute;
                    top: 10px;
                    right: 12px;
                    background: var(--danger);
                    color: white;
                    font-size: 0.65rem;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-weight: 800;
                    border: 2px solid var(--card-bg);
                }

                .settings-panel .settings-card {
                    background: var(--card-bg);
                    border-radius: 24px;
                    border: 1.5px solid var(--border-color);
                    padding: 40px;
                    min-height: 550px;
                }
                .shadow-premium { box-shadow: var(--shadow-md); }

                .form-group { margin-bottom: 24px; }
                .form-group label { display: block; font-weight: 800; color: var(--text-main); font-size: 0.9rem; margin-bottom: 10px; }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1.5px solid var(--border-color);
                    background: var(--input-bg);
                    color: var(--text-main);
                    font-family: inherit; font-weight: 600; font-size: 0.95rem; box-sizing: border-box;
                }
                .form-group input:focus { border-color: var(--primary-color); outline: none; }
                
                .btn-save {
                    background: var(--primary-color); color: white; border: none; padding: 12px 32px; border-radius: 14px;
                    font-weight: 800; cursor: pointer; transition: all 0.3s;
                }
                .btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,167,38,0.2); }

                /* Notifications within settings */
                .noti-list-settings { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
                .noti-tile {
                    display: flex; gap: 16px; padding: 18px; border-radius: 18px; border: 1.5px solid var(--border-color);
                    background: var(--card-bg); transition: all 0.2s; align-items: center;
                }
                .noti-tile.unread { background: rgba(255, 167, 38, 0.02); border-left: 4px solid var(--primary-color); }
                .noti-tile:hover { transform: translateY(-2px); border-color: var(--primary-color); box-shadow: var(--shadow-sm); }
                
                .noti-tile-icon {
                    width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center;
                    justify-content: center; font-size: 1.2rem; flex-shrink: 0;
                }
                .noti-tile-body { flex: 1; }
                .noti-tile-text { font-weight: 700; color: var(--text-main); font-size: 0.95rem; margin-bottom: 4px; }
                .noti-tile-date { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }
                
                .noti-tile-delete {
                    padding: 8px; border-radius: 8px; color: var(--text-light); border: none; background: transparent; cursor: pointer;
                }
                .noti-tile-delete:hover { color: var(--danger); background: rgba(214, 48, 49, 0.05); }

                @media (max-width: 900px) {
                    .settings-layout { grid-template-columns: 1fr; }
                }
            </style>
        `;

        // Interaction Logic
        container.querySelectorAll('.settings-nav-item[data-tab]').forEach(btn => {
            btn.onclick = () => {
                activeTab = btn.dataset.tab;
                render();
            };
        });

        // Personal Form
        const pForm = document.getElementById('personal-form');
        if (pForm) {
            pForm.onsubmit = async (e) => {
                e.preventDefault();
                try {
                    const data = {
                        full_name: pForm.full_name.value,
                        username: pForm.username.value,
                        email: pForm.email.value,
                        bio: pForm.bio.value
                    };
                    await api.put('/auth/profile/update', data);
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({ ...user, ...data }));
                    api.showBeeAlert('Đã cập nhật thông tin cá nhân! ✨');
                    await loadData();
                    render();
                } catch (err) { api.showBeeAlert(err.message); }
            };
        }

        // Password Form
        const passForm = document.getElementById('pass-form');
        if (passForm) {
            passForm.onsubmit = async (e) => {
                e.preventDefault();
                if (passForm.new_p.value !== passForm.conf_p.value) return api.showBeeAlert('Mật khẩu xác nhận không khớp!');
                try {
                    await api.post('/auth/change-password', {
                        currentPassword: passForm.cur_p.value,
                        newPassword: passForm.new_p.value
                    });
                    api.showBeeAlert('Đổi mật khẩu thành công! 🐝');
                    passForm.reset();
                } catch (err) { api.showBeeAlert(err.message); }
            };

            // Toggle logic for each password field
            container.querySelectorAll('.pass-toggle').forEach(btn => {
                btn.onclick = () => {
                    const input = btn.parentElement.querySelector('input');
                    const icon = btn.querySelector('i');
                    if (input.type === 'password') {
                        input.type = 'text';
                        icon.className = 'far fa-eye-slash';
                    } else {
                        input.type = 'password';
                        icon.className = 'far fa-eye';
                    }
                };
            });
        }

        // Notification actions
        const markAll = document.getElementById('mark-all');
        if (markAll) {
            markAll.onclick = async () => {
                try {
                    await api.put('/notifications/mark-as-read');
                    await loadData();
                    render();
                } catch (err) { console.error(err); }
            };
        }

        container.querySelectorAll('.noti-tile-delete').forEach(btn => {
            btn.onclick = async (e) => {
                e.stopPropagation();
                try {
                    await api.delete(`/notifications/delete/${btn.dataset.id}`);
                    await loadData();
                    render();
                } catch (err) { console.error(err); }
            };
        });

        // Appearance interaction
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.onchange = async () => {
                const newTheme = themeToggle.checked ? 'dark' : 'light';
                try {
                    await api.put('/auth/settings/update', { theme: newTheme });
                    window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: newTheme } }));
                    api.showBeeAlert(`Đã chuyển sang chế độ ${newTheme === 'dark' ? 'Tối' : 'Sáng'}!`);
                    userSettings.theme = newTheme;
                } catch (err) { api.showBeeAlert(err.message); }
            };
        }

        const notiToggle = document.getElementById('noti-toggle');
        if (notiToggle) {
            notiToggle.onchange = async () => {
                try {
                    const enabled = notiToggle.checked;
                    await api.put('/auth/settings/update', { notifications_enabled: enabled });
                    api.showBeeAlert(enabled ? 'Đã bật thông báo hệ thống! 🔔' : 'Đã tắt thông báo hệ thống.');
                    userSettings.notifications_enabled = enabled;
                } catch (err) { api.showBeeAlert(err.message); }
            };
        }

        container.querySelectorAll('.accent-color-option').forEach(opt => {
            opt.onclick = async () => {
                const color = opt.dataset.color;
                try {
                    await api.put('/auth/settings/update', { accent_color: color });
                    api.showBeeAlert('Đã cập nhật màu chủ đạo mới!');
                    userSettings.accent_color = color;
                    
                    // Dispatch global event for immediate update
                    window.dispatchEvent(new CustomEvent('accent-color-changed', { detail: { color: color } }));
                    
                    render();
                } catch (err) { api.showBeeAlert(err.message); }
            };
        });
    };

    function renderTabContent() {
        if (activeTab === 'personal') {
            return `
                <div style="display: flex; align-items: center; gap: 32px; margin-bottom: 40px;">
                    <div style="width: 110px; height: 110px; border-radius: 24px; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem; font-weight: 800; box-shadow: 0 8px 20px rgba(255,167,38,0.2);">
                        ${userData.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); margin-bottom: 6px;">${userData.full_name || userData.username}</h3>
                        <p style="color: var(--text-muted); font-weight: 600; font-size: 0.9rem;">Cập nhật hồ sơ cá nhân và ảnh đại diện của bạn.</p>
                    </div>
                </div>
                <form id="personal-form">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div class="form-group"><label>Họ tên</label><input name="full_name" value="${userData.full_name || ''}"></div>
                        <div class="form-group"><label>Tên đăng nhập</label><input name="username" value="${userData.username}"></div>
                        <div class="form-group" style="grid-column: span 2;"><label>Email</label><input name="email" value="${userData.email}"></div>
                        <div class="form-group" style="grid-column: span 2;"><label>Giới thiệu</label><textarea name="bio" rows="3">${userData.bio || ''}</textarea></div>
                    </div>
                    <div style="display: flex; justify-content: flex-end;"><button class="btn-save">Lưu thay đổi</button></div>
                </form>
            `;
        } else if (activeTab === 'password') {
            return `
                <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 24px;">Đổi mật khẩu</h3>
                <form id="pass-form" style="max-width: 450px;">
                    <div class="form-group">
                        <label>Mật khẩu hiện tại</label>
                        <div class="pass-input-wrapper">
                            <input type="password" name="cur_p" required placeholder="••••••••">
                            <button type="button" class="pass-toggle"><i class="far fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu mới</label>
                        <div class="pass-input-wrapper">
                            <input type="password" name="new_p" required placeholder="••••••••">
                            <button type="button" class="pass-toggle"><i class="far fa-eye"></i></button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Xác nhận mật khẩu mới</label>
                        <div class="pass-input-wrapper">
                            <input type="password" name="conf_p" required placeholder="••••••••">
                            <button type="button" class="pass-toggle"><i class="far fa-eye"></i></button>
                        </div>
                    </div>
                    <button class="btn-save" style="margin-top: 10px;">Cập nhật mật khẩu</button>
                </form>
                <style>
                    .pass-input-wrapper { position: relative; }
                    .pass-toggle {
                        position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
                        background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 4px;
                        font-size: 1rem; transition: color 0.2s;
                    }
                    .pass-toggle:hover { color: var(--primary-color); }
                </style>
            `;
        } else if (activeTab === 'notifications') {
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="font-size: 1.4rem; font-weight: 900;">Thông báo của tôi</h3>
                    <button id="mark-all" class="secondary-btn" style="padding: 8px 16px; font-weight: 700; border-radius: 10px; border: 1.5px solid var(--border-color); background: var(--card-bg); cursor: pointer; color: var(--text-main);">Đã đọc tất cả</button>
                </div>
                <div class="noti-list-settings">
                    ${notifications.length > 0 ? notifications.map(noti => {
                        let icon = 'fa-bell'; let color = 'var(--primary-color)';
                        if (noti.message.includes('hoàn thành')) { icon = 'fa-check-circle'; color = 'var(--success)'; }
                        if (noti.message.includes('kế hoạch')) { icon = 'fa-calendar-alt'; color = 'var(--info)'; }
                        return `
                        <div class="noti-tile ${noti.is_read ? '' : 'unread'}">
                            <div class="noti-tile-icon" style="background: ${color}10; color: ${color};"><i class="fas ${icon}"></i></div>
                            <div class="noti-tile-body">
                                <div class="noti-tile-text">${noti.message}</div>
                                <div class="noti-tile-date">${new Date(noti.created_at).toLocaleString('vi-VN')}</div>
                            </div>
                            <button class="noti-tile-delete" data-id="${noti.id}"><i class="far fa-trash-alt"></i></button>
                        </div>`;
                    }).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 50px;">Bạn chưa có thông báo nào.</p>'}
                </div>
            `;
        } else if (activeTab === 'appearance') {
            return `
                <div style="margin-bottom: 40px;">
                    <h3 style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); margin-bottom: 8px;">Giao diện & Chủ đề</h3>
                    <p style="color: var(--text-muted); font-weight: 600; font-size: 0.9rem;">Tùy chỉnh cá nhân hóa trải nghiệm sử dụng PlanBee.</p>
                </div>

                <div style="display: flex; flex-direction: column; gap: 32px;">
                    <!-- Theme Toggle -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <div style="font-weight: 800; color: var(--text-main); font-size: 1rem;">Chế độ Tối (Dark Mode)</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Giúp bảo vệ mắt của bạn trong môi trường thiếu sáng.</div>
                        </div>
                        <label class="bee-switch">
                            <input type="checkbox" id="theme-toggle" ${userSettings.theme === 'dark' ? 'checked' : ''}>
                            <span class="bee-slider"></span>
                        </label>
                    </div>

                    <!-- Noti Toggle -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 24px; border-bottom: 1px solid var(--border-color);">
                        <div>
                            <div style="font-weight: 800; color: var(--text-main); font-size: 1rem;">Thông báo hệ thống</div>
                            <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Cho phép PlanBee gửi thông báo đẩy tới trình duyệt.</div>
                        </div>
                        <label class="bee-switch">
                            <input type="checkbox" id="noti-toggle" ${userSettings.notifications_enabled ? 'checked' : ''}>
                            <span class="bee-slider"></span>
                        </label>
                    </div>

                    <!-- Accent Colors -->
                    <div>
                        <div style="font-weight: 800; color: var(--text-main); font-size: 1rem; margin-bottom: 16px;">Màu sắc chủ đạo</div>
                        <div style="display: flex; gap: 16px;">
                            ${['#FFA726', '#FFD700', '#FF6B6B', '#4834d4', '#20bf6b'].map(color => `
                                <div class="accent-color-option ${userSettings.accent_color === color ? 'active' : ''}" 
                                     style="background: ${color};" 
                                     data-color="${color}">
                                     ${userSettings.accent_color === color ? '<i class="fas fa-check" style="color: white; font-size: 0.8rem;"></i>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <style>
                    /* Premium Switch Style */
                    .bee-switch { position: relative; display: inline-block; width: 60px; height: 32px; }
                    .bee-switch input { opacity: 0; width: 0; height: 0; }
                    .bee-slider {
                        position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                        background: #e0e0e0; transition: .4s; border-radius: 34px;
                    }
                    .bee-slider:before {
                        position: absolute; content: ""; height: 26px; width: 26px; left: 4px; bottom: 3px;
                        background: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                    }
                    input:checked + .bee-slider { background: var(--primary-color); }
                    input:checked + .bee-slider:before { transform: translateX(26px); }

                    /* Accent Colors */
                    .accent-color-option {
                        width: 40px; height: 40px; border-radius: 12px; cursor: pointer; transition: all 0.2s;
                        display: flex; align-items: center; justify-content: center; border: 3px solid transparent;
                    }
                    .accent-color-option:hover { transform: scale(1.1); }
                    .accent-color-option.active { border-color: rgba(0,0,0,0.1); transform: scale(1.05); }
                </style>
            `;
        } else if (activeTab === 'security') {
            return `<h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 24px;">Bảo mật</h3><p style="color: var(--text-muted);">Tính năng bảo mật nâng cao đang được cập nhật...</p>`;
        }
    }

    render();
};
