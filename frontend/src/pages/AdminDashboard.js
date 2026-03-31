import { navigate } from '../../main.js';

export const renderAdminDashboard = async (container, activePage, params) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
        navigate('#/dashboard');
        return;
    }

    const token = localStorage.getItem('token');
    const subPage = activePage.replace('admin-', '');

    // Common Loading Logic
    const fetchData = async (url) => {
        try {
            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`Fetch error ${res.status}:`, errorText);
                return null;
            }
            return await res.json();
        } catch (error) {
            console.error('Fetch Exception:', error);
            return null;
        }
    };

    // --- Sub-components ---

    const renderOverview = async () => {
        const stats = await fetchData('/api/admin/stats');
        if (!stats || !stats.summary) return '<div class="header"><h1>Overview</h1><p style="color: var(--danger);">Không thể kết nối API hoặc Token không hợp lệ. Vui lòng đăng nhập lại.</p></div>';
        
        return `
            <div class="header">
                <h1>Overview Dashboard</h1>
                <p>Thống kê nhanh hệ thống PlanBee 🐝</p>
            </div>
            <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px; margin-top: 24px;">
                <div class="stat-card" style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color);">
                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted);">TỔNG NGƯỜI DÙNG</div>
                    <div style="font-size: 2.5rem; font-weight: 800;">${stats.summary.totalUsers}</div>
                </div>
                <div class="stat-card" style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color);">
                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted);">AI KEYS STATUS</div>
                    <div style="font-size: 2.5rem; font-weight: 800; color: #4CAF50;">${stats.summary.aiKeysStatus}</div>
                </div>
                <div class="stat-card" style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color);">
                    <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-muted);">TRUNG BÌNH TASKS</div>
                    <div style="font-size: 2.5rem; font-weight: 800;">${stats.summary.avgTasks}</div>
                </div>
            </div>
        `;
    };

    const renderUserManagement = async () => {
        const users = await fetchData('/api/admin/users');
        if (!users || !Array.isArray(users)) return '<p style="color: var(--danger); padding: 50px; font-weight: 800;">Lỗi: Token không hợp lệ hoặc hết hạn!</p>';

        return `
            <div class="header">
                <h1>Quản lý Người dùng</h1>
                <p>Xem danh sách và thay đổi trạng thái tài khoản</p>
            </div>
            <div style="background: white; border-radius: 24px; padding: 24px; border: 1.5px solid var(--border-color); margin-top: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="text-align: left; border-bottom: 1px solid var(--border-color);">
                            <th style="padding: 16px;">User</th>
                            <th style="padding: 16px;">Role</th>
                            <th style="padding: 16px;">Plan</th>
                            <th style="padding: 16px;">Status</th>
                            <th style="padding: 16px; text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr style="border-bottom: 1px solid #f8fafc;">
                                <td style="padding: 16px;"><b>${u.username}</b><br><small>${u.email}</small></td>
                                <td style="padding: 16px;">${u.role}</td>
                                <td style="padding: 16px;">${u.account_type}</td>
                                <td style="padding: 16px;">${u.is_active ? 'Active' : 'Locked'}</td>
                                <td style="padding: 16px; text-align: right;">
                                    <button onclick="window.adminToggleUser(${u.id}, ${u.is_active})" style="padding: 8px 16px; border-radius: 8px; border: 1px solid #ddd; cursor: pointer;">
                                        ${u.is_active ? 'Re-lock' : 'Unlock'}
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    };

    const renderAIMonitoring = async () => {
        const logs = await fetchData('/api/admin/logs');
        const config = await fetchData('/api/admin/config/ai-prompt');

        return `
            <div class="header">
                <h1>Giám sát & Điều phối AI</h1>
                <p>Cấu hình logic Bee và theo dõi nhật ký trò chuyện hệ thống</p>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 32px;">
                <!-- Config Card -->
                <div style="background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                        <div style="width: 40px; height: 40px; background: rgba(255,167,38,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary-color);">
                            <i class="fas fa-magic"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800;">Bee System Prompt</h3>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Đây là chuỗi hướng dẫn gốc định hình tính cách và khả năng của Bee AI.</p>
                    <textarea id="ai-prompt-input" style="width: 100%; height: 350px; padding: 16px; border-radius: 16px; border: 1.5px solid var(--border-color); font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; line-height: 1.6; margin-bottom: 20px; outline: none; background: #fafafa;">${config || ''}</textarea>
                    <button id="save-prompt" style="width: 100%; padding: 16px; background: var(--primary-color); color: white; border: none; border-radius: 14px; cursor: pointer; font-weight: 800; transition: all 0.3s ease; box-shadow: 0 8px 20px rgba(255,167,38,0.25);">
                        Lưu cấu hình hệ thống
                    </button>
                </div>

                <!-- Logs Card -->
                <div style="background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.03);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <div style="width: 40px; height: 40px; background: rgba(33,150,243,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #2196F3;">
                            <i class="fas fa-terminal"></i>
                        </div>
                        <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800;">Live Interaction Logs</h3>
                    </div>
                    
                    <div style="flex: 1; overflow-y: auto; padding-right: 8px;">
                        ${logs && logs.chatLogs && logs.chatLogs.length > 0 ? logs.chatLogs.map(l => `
                            <div style="padding: 16px; background: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7; margin-bottom: 16px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                    <span style="font-weight: 800; font-size: 0.75rem; color: var(--primary-color);">@${l.username}</span>
                                    <span style="font-size: 0.7rem; color: var(--text-muted);">${new Date(l.created_at).toLocaleTimeString()}</span>
                                </div>
                                <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">"${l.message}"</div>
                                <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5; border-left: 3px solid #e2e8f0; padding-left: 12px;">
                                    ${l.response.substring(0, 150)}...
                                </div>
                            </div>
                        `).join('') : '<p style="text-align: center; color: var(--text-muted); padding: 40px;">Chưa có lịch sử trò chuyện nào.</p>'}
                    </div>
                </div>
            </div>
        `;
    };

    const renderNotifications = () => {
        return `
            <div class="header">
                <h1>Quản lý Thông báo</h1>
                <p>Gửi thông báo broadcast cho người dùng</p>
            </div>
            <div style="background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); margin-top: 24px; max-width: 600px;">
                <textarea id="broadcast-msg" style="width: 100%; height: 120px; padding: 16px; border-radius: 16px; border: 1px solid #ddd; margin-bottom: 16px;" placeholder="Nhập nội dung thông báo..."></textarea>
                <select id="broadcast-plat" style="width: 100%; padding: 12px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 16px;">
                    <option value="both">All (Web + Telegram)</option>
                    <option value="web">Website Only</option>
                    <option value="telegram">Telegram Only</option>
                </select>
                <button id="send-broadcast" style="width: 100%; padding: 14px; background: #000; color: white; border: none; border-radius: 14px; cursor: pointer; font-weight: 700;">Broadcast Now</button>
            </div>
        `;
    };

    // --- Main Rendering ---

    let contentHTML = '';
    switch (subPage) {
        case 'dashboard': contentHTML = await renderOverview(); break;
        case 'users': contentHTML = await renderUserManagement(); break;
        case 'ai': contentHTML = await renderAIMonitoring(); break;
        case 'notifications': contentHTML = await renderNotifications(); break;
        case 'stats': contentHTML = `<h1>Performance Stats</h1><p>Feature coming soon...</p>`; break;
        default: contentHTML = await renderOverview();
    }

    container.innerHTML = `
        <div class="admin-view-wrapper" style="padding: 32px; animation: fadeIn 0.4s ease;">
            ${contentHTML}
        </div>
    `;

    // --- Dynamic Handlers ---

    if (subPage === 'ai') {
        document.getElementById('save-prompt').onclick = async () => {
            const prompt = document.getElementById('ai-prompt-input').value;
            await fetch('/api/admin/config/ai-prompt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt })
            });
            alert('Updated system prompt!');
        };
    }

    if (subPage === 'notifications') {
        document.getElementById('send-broadcast').onclick = async () => {
            const msg = document.getElementById('broadcast-msg').value;
            const plat = document.getElementById('broadcast-plat').value;
            if (!msg) return;
            await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: msg, platform: plat })
            });
            alert('Sent!');
            document.getElementById('broadcast-msg').value = '';
        };
    }

    window.adminToggleUser = async (id, status) => {
        const users = await (await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` } })).json();
        const u = users.find(x => x.id === id);
        await fetch(`/api/admin/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...u, is_active: status ? 0 : 1 })
        });
        renderAdminDashboard(container, activePage, params);
    };
};
