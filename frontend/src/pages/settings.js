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
            <div class="settings-root fade-in">
                <div class="settings-header">
                    <h2 class="settings-title">Cài đặt</h2>
                    <p class="settings-subtitle">Cá nhân hóa trải nghiệm PlanBee của bạn.</p>
                </div>

                <div class="settings-container">
                    <!-- Navigation Tabs -->
                    <div class="settings-nav-wrapper">
                        <div class="settings-nav-scroll">
                            ${['personal', 'password', 'notifications', 'appearance', 'security'].map(tab => {
                                const labels = { 
                                    personal: 'Cá nhân', 
                                    password: 'Bảo mật', 
                                    notifications: 'Thông báo', 
                                    appearance: 'Giao diện', 
                                    security: 'Quyền riêng tư' 
                                };
                                const icons = {
                                    personal: 'fa-user-circle',
                                    password: 'fa-shield-halved',
                                    notifications: 'fa-bell',
                                    appearance: 'fa-palette',
                                    security: 'fa-lock'
                                };
                                const unreadCount = notifications.filter(n => !n.is_read).length;
                                return `
                                    <button class="settings-tab-btn ${activeTab === tab ? 'active' : ''}" data-tab="${tab}">
                                        <i class="fas ${icons[tab]}"></i>
                                        <span>${labels[tab]}</span>
                                        ${tab === 'notifications' && unreadCount > 0 ? `<span class="tab-badge">${unreadCount > 9 ? '9+' : unreadCount}</span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <!-- Content Panel -->
                    <div class="settings-main-panel">
                        <div class="settings-content-card">
                            ${renderTabContent()}
                        </div>
                    </div>
                </div>
            </div>

            <style>
                .settings-root { padding: 16px; width: 100%; max-width: 100%; margin: 0; min-height: 100vh; box-sizing: border-box; }
                
                .settings-header { margin-bottom: 24px; padding: 0 4px; }
                .settings-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px; letter-spacing: -0.5px; }
                .settings-subtitle { font-size: 0.9rem; color: var(--text-muted); font-weight: 500; }

                .settings-container { display: flex; flex-direction: column; gap: 20px; width: 100%; }

                /* Horizontal Tabs (Mobile-First) */
                .settings-nav-wrapper {
                    position: sticky; top: 0; z-index: 100;
                    margin: 0 -16px; padding: 4px 16px;
                    background: var(--bg-main);
                    overflow-x: auto; scrollbar-width: none;
                }
                .settings-nav-wrapper::-webkit-scrollbar { display: none; }
                
                .settings-nav-scroll { display: flex; gap: 8px; padding-bottom: 8px; }

                .settings-tab-btn {
                    flex: 0 0 auto; display: flex; align-items: center; gap: 10px;
                    padding: 10px 18px; border-radius: 12px; border: 1.5px solid var(--border-color);
                    background: var(--card-bg); color: var(--text-muted); font-weight: 700;
                    font-size: 0.85rem; cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap; position: relative;
                }
                .settings-tab-btn i { font-size: 1rem; opacity: 0.7; }
                .settings-tab-btn.active { 
                    background: var(--primary-color) !important; color: white !important; 
                    border-color: var(--primary-color) !important;
                    box-shadow: 0 4px 12px rgba(255, 167, 38, 0.2);
                }

                /* Desktop Adaptations (Full Width) */
                @media (min-width: 900px) {
                    .settings-container { flex-direction: row; align-items: flex-start; gap: 24px; }
                    .settings-nav-wrapper { 
                        position: sticky; top: 16px; width: 220px; margin: 0; padding: 0;
                        background: transparent; flex-shrink: 0;
                    }
                    .settings-nav-scroll { flex-direction: column; width: 100%; gap: 4px; }
                    .settings-tab-btn { width: 100%; border: none; background: transparent; padding: 12px 14px; font-size: 0.95rem; }
                    .settings-main-panel { flex: 1; min-width: 0; } /* Allow flexing to fill width */
                }

                .settings-content-card {
                    background: var(--card-bg); border-radius: 20px;
                    border: 1.5px solid var(--border-color); padding: 32px;
                    box-shadow: var(--shadow-sm); animation: slideUp 0.3s ease-out;
                    width: 100%; box-sizing: border-box;
                }

                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                /* Form Styles */
                .form-group { margin-bottom: 20px; }
                .form-group label { display: block; font-weight: 800; color: var(--text-main); font-size: 0.85rem; margin-bottom: 8px; opacity: 0.8; }
                .form-group input, .form-group textarea, .form-group select {
                    width: 100%; padding: 12px 14px; border-radius: 12px;
                    border: 1.5px solid var(--border-color); background: var(--input-bg);
                    color: var(--text-main); font-family: inherit; font-weight: 650;
                    font-size: 0.9rem; transition: all 0.2s; outline: none; box-sizing: border-box;
                }
                .form-group input:focus { border-color: var(--primary-color); background: white; box-shadow: 0 0 0 4px var(--primary-light); }
                
                .btn-save { padding: 12px 32px; background: var(--primary-color); color: white; border: none; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; }
                .btn-save:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255,167,38,0.2); }

                /* Notifications Tab Styles */
                .noti-list-settings { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
                .noti-tile {
                    display: flex; align-items: center; gap: 14px; padding: 16px; 
                    border-radius: 16px; border: 1.5px solid var(--border-color);
                    background: var(--card-bg); transition: all 0.2s;
                }
                .noti-tile:hover { transform: translateY(-2px); border-color: var(--primary-color); box-shadow: var(--shadow-sm); }
                .noti-tile.unread { border-left: 4px solid var(--primary-color); background: rgba(255, 167, 38, 0.02); }
                .noti-tile-icon { width: 42px; height: 42px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; }
                .noti-tile-body { flex: 1; min-width: 0; }
                .noti-tile-text { font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .noti-tile-date { font-size: 0.75rem; color: var(--text-light); }
                .noti-tile-delete { background: none; border: none; padding: 8px; color: var(--text-light); cursor: pointer; border-radius: 8px; }
                .noti-tile-delete:hover { color: var(--danger); background: rgba(214, 48, 49, 0.1); }

                /* Password Toggle Styles */
                .pass-input-wrapper { position: relative; }
                .pass-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1rem; }

                /* Appearance Switch Styles */
                .bee-switch { position: relative; display: inline-block; width: 50px; height: 26px; }
                .bee-switch input { opacity: 0; width: 0; height: 0; }
                .bee-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: #e0e0e0; transition: .4s; border-radius: 34px; }
                .bee-slider:before { position: absolute; content: ""; height: 20px; width: 20px; left: 3px; bottom: 3px; background: white; transition: .4s; border-radius: 50%; }
                input:checked + .bee-slider { background: var(--primary-color); }
                input:checked + .bee-slider:before { transform: translateX(24px); }

                /* Accent Color Options */
                .accent-color-option { width: 36px; height: 36px; border-radius: 10px; cursor: pointer; transition: 0.2s; border: 3px solid transparent; display: flex; align-items: center; justify-content: center; }
                .accent-color-option.active { border-color: rgba(0,0,0,0.1); transform: scale(1.1); }
            </style>
        `;

        // Interaction Logic - Sync with new tab buttons
        container.querySelectorAll('.settings-tab-btn[data-tab]').forEach(btn => {
            btn.onclick = () => {
                activeTab = btn.dataset.tab;
                render();
            };
        });

        // Personal Form Logic
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

        // Copy Telegram Token
        const copyBtn = document.getElementById('copy-telegram-token');
        if (copyBtn) {
            copyBtn.onclick = () => {
                const token = userData.telegram_token;
                if (!token) return;
                navigator.clipboard.writeText(token);
                api.showBeeAlert('Đã sao chép mã token! 📋');
            };
        }

        // Unlink Telegram Logic
        const unlinkBtn = document.getElementById('unlink-telegram');
        if (unlinkBtn) {
            unlinkBtn.onclick = async () => {
                if (confirm('Bạn có chắc chắn muốn hủy liên kết Telegram? Bee sẽ không thể gửi thông báo cho bạn qua đó nữa.')) {
                    try {
                        await api.post('/auth/unlink-telegram');
                        api.showBeeAlert('Đã hủy liên kết Telegram thành công! 👋');
                        await loadData();
                        render();
                    } catch (err) { api.showBeeAlert(err.message); }
                }
            };
        }

        // 3. Password Form Logic
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
                    <div style="width: 120px; height: 120px; border-radius: 50%; background: white; border: 3px solid var(--primary-color); display: flex; align-items: center; justify-content: center; overflow: hidden; box-shadow: 0 10px 25px rgba(255,167,38,0.25); transition: all 0.3s ease;">
                        <img src="/bee.png" alt="Profile Avatar" style="width: 75%; height: 75%; object-fit: contain;">
                    </div>
                    <div>
                        <h3 style="font-size: 1.6rem; font-weight: 900; color: var(--text-main); margin-bottom: 8px;">${userData.full_name || userData.username}</h3>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span class="user-role" style="background: var(--primary-color)15; color: var(--primary-dark); padding: 4px 14px; border-radius: 30px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Premium Plan</span>
                            <span style="height: 4px; width: 4px; background: var(--text-light); border-radius: 50%;"></span>
                            <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: 600;">@${userData.username}</span>
                        </div>
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

                <!-- Telegram Connection Section (Compact Redesign) -->
                <div class="telegram-config-box-mini">
                    <div class="tg-mini-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <i class="fab fa-telegram-plane" style="color: #0088cc; font-size: 1.2rem;"></i>
                            <h4 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-main);">Liên kết Telegram Bot</h4>
                            <div class="tg-status-pill ${userData.telegram_chat_id ? 'connected' : ''}">
                                ${userData.telegram_chat_id ? 'Đã liên kết' : 'Chưa liên kết'}
                            </div>
                        </div>
                    </div>
                    
                    <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; font-weight: 500;">Nhận thông báo và điều khiển Bee qua Telegram.</p>
                    
                    <div class="tg-id-strip">
                        <div class="tg-token-val">${userData.telegram_token || '---'}</div>
                        <div class="tg-actions-wrap">
                            <button id="copy-telegram-token" class="tg-mini-btn copy" title="Sao chép mã">
                                <i class="far fa-copy"></i> Sao chép
                            </button>
                            ${userData.telegram_chat_id ? `
                                <button id="unlink-telegram" class="tg-mini-btn delete" title="Hủy liên kết">
                                    <i class="fas fa-link-slash"></i> Hủy kết nối
                                </button>
                            ` : `
                                <a href="https://t.me/PlanBeeAI_Bot" target="_blank" class="tg-mini-btn open">
                                    Mở Bot <i class="fas fa-external-link-alt"></i>
                                </a>
                            `}
                        </div>
                    </div>
                </div>

                <style>
                    .telegram-config-box-mini {
                        margin-top: 24px; padding: 20px;
                        background: var(--card-bg); border-radius: 16px;
                        border: 1px solid var(--border-color); border-left: 4px solid #0088cc;
                    }
                    .tg-mini-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
                    .tg-status-pill {
                        font-size: 0.65rem; font-weight: 900; padding: 2px 8px; border-radius: 6px;
                        background: #f1f2f6; color: var(--text-muted); text-transform: uppercase;
                    }
                    .tg-status-pill.connected { background: #e8f5e9; color: #2e7d32; }
                    
                    .tg-id-strip {
                        display: flex; align-items: center; gap: 8px;
                        background: var(--input-bg); padding: 4px 4px 4px 14px; border-radius: 12px;
                        border: 1px solid var(--border-color); overflow: hidden;
                    }
                    .tg-token-val {
                        flex: 1; font-family: 'JetBrains Mono', monospace; font-weight: 800;
                        color: var(--primary-color); font-size: 0.9rem; letter-spacing: 0.5px;
                        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                    }
                    .tg-actions-wrap { display: flex; gap: 4px; flex-shrink: 0; }
                    
                    .tg-mini-btn {
                        padding: 8px 12px; border-radius: 8px; border: none; font-weight: 800; font-size: 0.75rem;
                        cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px;
                        text-decoration: none; white-space: nowrap;
                    }
                    .tg-mini-btn.copy { background: var(--primary-color); color: white; }
                    .tg-mini-btn.delete { background: #fee2e2; color: #ef4444; }
                    .tg-mini-btn.open { background: #0088cc; color: white; }
                    
                    .tg-mini-btn:hover { opacity: 0.8; transform: translateY(-1px); }
                </style>
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
                        if (noti.message.includes('lập kế hoạch') || noti.message.includes('tạo')) { icon = 'fa-calendar-plus'; color = 'var(--info)'; }
                        
                        const targetPath = noti.type === 'plan' ? `#/planning?id=${noti.target_id}` : (noti.type === 'task' ? `#/tasks?id=${noti.target_id}` : null);

                        return `
                        <div class="noti-tile ${noti.is_read ? '' : 'unread'}" 
                             style="cursor: ${targetPath ? 'pointer' : 'default'};"
                             onclick="${targetPath ? `window.location.hash='${targetPath}'` : ''}">
                            <div class="noti-tile-icon" style="background: ${color}10; color: ${color};"><i class="fas ${icon}"></i></div>
                            <div class="noti-tile-body">
                                <div class="noti-tile-text" style="font-weight: ${noti.is_read ? '600' : '800'};">${noti.message}</div>
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
