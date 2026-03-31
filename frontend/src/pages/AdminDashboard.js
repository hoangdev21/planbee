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
        const [stats, users] = await Promise.all([
            fetchData('/api/admin/stats'),
            fetchData('/api/admin/users')
        ]);
        
        if (!stats || !stats.summary) return '<div class="header"><h1>Overview</h1><p style="color: var(--danger);">Không thể kết nối API. Vui lòng thử lại.</p></div>';
        
        const recentUsers = users ? users.slice(0, 5) : []; // Get 5 newest users

        return `
            <div class="header" style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px; color: #1e293b;">Chào mừng trở lại, Admin! 👋</h1>
                    <p style="color: var(--text-muted); margin: 0; font-size: 0.95rem;">Đây là bảng điều khiển tổng quan của hệ thống PlanBee 🐝</p>
                </div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #64748b; background: white; padding: 10px 20px; border-radius: 20px; border: 1.5px solid var(--border-color);">
                    <i class="far fa-clock" style="margin-right: 8px;"></i>${new Date().toLocaleString('vi-VN')}
                </div>
            </div>

            <!-- Top Stats -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 32px;">
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 20px;">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(33, 150, 243, 0.1); color: #2196F3; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;"><i class="fas fa-users"></i></div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Tổng Users</div>
                        <div style="font-size: 2rem; font-weight: 900; color: #1e293b;">${stats.summary.totalUsers}</div>
                    </div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 20px;">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(76, 175, 80, 0.1); color: #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;"><i class="fas fa-key"></i></div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">API Keys Status</div>
                        <div style="font-size: 2rem; font-weight: 900; color: #1e293b;">${stats.summary.aiKeysStatus}</div>
                    </div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 20px;">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 167, 38, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;"><i class="fas fa-tasks"></i></div>
                    <div>
                        <div style="font-size: 0.8rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase;">Tasks TB/User</div>
                        <div style="font-size: 2rem; font-weight: 900; color: #1e293b;">${stats.summary.avgTasks}</div>
                    </div>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;" class="overview-panels-grid">
                <!-- Quick Actions Panel -->
                <div style="background: white; border-radius: 24px; padding: 32px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
                        <div style="width: 40px; height: 40px; background: rgba(139, 92, 246, 0.1); color: #8b5cf6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"><i class="fas fa-bolt"></i></div>
                        <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #1e293b;">Phím Tắt Nhanh</h3>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <a href="#/admin/users" style="text-decoration: none; padding: 20px; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='none'">
                            <i class="fas fa-user-plus" style="font-size: 1.5rem; color: #3b82f6;"></i>
                            <div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Quản lý Users</div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Xem & thêm tài khoản</div>
                            </div>
                        </a>
                        <a href="#/admin/stats" style="text-decoration: none; padding: 20px; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='none'">
                            <i class="fas fa-chart-line" style="font-size: 1.5rem; color: #10b981;"></i>
                            <div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Hiệu Suất (Stats)</div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Biểu đồ tăng trưởng</div>
                            </div>
                        </a>
                        <a href="#/admin/ai" style="text-decoration: none; padding: 20px; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='none'">
                            <i class="fas fa-robot" style="font-size: 1.5rem; color: #8b5cf6;"></i>
                            <div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Điều Phối AI</div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Quản lý API Keys Quota</div>
                            </div>
                        </a>
                        <a href="#/admin/notifications" style="text-decoration: none; padding: 20px; border-radius: 16px; background: #f8fafc; border: 1.5px solid #e2e8f0; display: flex; flex-direction: column; gap: 12px; transition: all 0.2s;" onmouseover="this.style.background='#f1f5f9'; this.style.borderColor='#cbd5e1'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#f8fafc'; this.style.borderColor='#e2e8f0'; this.style.transform='none'">
                            <i class="fas fa-bell" style="font-size: 1.5rem; color: var(--primary-color);"></i>
                            <div>
                                <div style="font-weight: 800; color: #1e293b; font-size: 0.95rem;">Gửi Thông Báo</div>
                                <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">Push Broadcast TB</div>
                            </div>
                        </a>
                    </div>
                </div>

                <!-- Recent Activity Panel -->
                <div style="background: white; border-radius: 24px; padding: 32px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div style="width: 40px; height: 40px; background: rgba(34, 197, 94, 0.1); color: #22c55e; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"><i class="fas fa-satellite-dish"></i></div>
                            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #1e293b;">Hoạt Động Gần Đây</h3>
                        </div>
                        <a href="#/admin-users" style="font-size: 0.85rem; font-weight: 700; color: var(--primary-color); text-decoration: none;">Xem tất cả</a>
                    </div>
                    
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 16px;">
                        ${recentUsers.length > 0 ? recentUsers.map((u, i) => `
                            <div style="display: flex; align-items: center; gap: 16px; padding-bottom: 16px; border-bottom: ${i === recentUsers.length - 1 ? 'none' : '1px solid #f1f5f9'};">
                                <div style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f8fafc, #f1f5f9); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; border: 1.5px solid #e2e8f0;">
                                    ${u.role === 'admin' ? '👑' : '😎'}
                                </div>
                                <div style="flex: 1;">
                                    <div style="font-weight: 800; font-size: 0.95rem; color: #1e293b; margin-bottom: 2px;">
                                        User <span style="color: var(--primary-color);">@${u.username}</span> vừa tham gia!
                                    </div>
                                    <div style="font-size: 0.8rem; color: #64748b; font-weight: 600;">
                                        Tạo ngày: ${new Date(u.created_at).toLocaleString('vi-VN')}
                                    </div>
                                </div>
                                <div style="font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: ${u.account_type === 'premium' ? 'rgba(34,197,94,0.1)' : 'var(--bg-color)'}; color: ${u.account_type === 'premium' ? '#22c55e' : 'var(--text-muted)'}; text-transform: uppercase;">
                                    ${u.account_type}
                                </div>
                            </div>
                        `).join('') : '<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 700;">Chưa có dữ liệu hoạt động.</div>'}
                    </div>
                </div>
            </div>

            <style>
                @media (max-width: 900px) {
                    .overview-panels-grid { grid-template-columns: 1fr !important; }
                }
            </style>
        `;
    };

    const renderUserManagement = async () => {
        const users = await fetchData('/api/admin/users');
        if (!users || !Array.isArray(users)) return '<p style="color: var(--danger); padding: 50px; font-weight: 800;">Lỗi: Token không hợp lệ hoặc hết hạn!</p>';

        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.is_active).length;
        const premiumUsers = users.filter(u => u.account_type === 'premium').length;

        window.adminUsersData = users; // Store for filtering

        return `
            <div class="header" style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 16px;">
                <div>
                    <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Quản lý Người dùng</h1>
                    <p style="color: var(--text-muted); margin: 0; font-size: 0.95rem;">Theo dõi và phân tích tình trạng tài khoản hệ thống</p>
                </div>
                <button onclick="window.adminOpenAddUserModal()" style="padding: 12px 24px; background: var(--primary-color); color: white; border: none; border-radius: 14px; font-weight: 800; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 16px rgba(255, 167, 38, 0.35); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    <i class="fas fa-plus"></i> Thêm User Mới
                </button>
            </div>

            <!-- Stats Dashboard -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; margin-bottom: 36px;">
                <div style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: box-shadow 0.3s;" onmouseover="this.style.boxShadow='0 8px 30px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.02)'">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(33, 150, 243, 0.1); color: #2196F3; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fas fa-users"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Tổng Tài Khoản</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b; line-height: 1;">${totalUsers}</div>
                    </div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: box-shadow 0.3s;" onmouseover="this.style.boxShadow='0 8px 30px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.02)'">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(76, 175, 80, 0.1); color: #4CAF50; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Đang Hoạt Động</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b; line-height: 1;">${activeUsers}</div>
                    </div>
                </div>
                <div style="background: white; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02); transition: box-shadow 0.3s;" onmouseover="this.style.boxShadow='0 8px 30px rgba(0,0,0,0.06)'" onmouseout="this.style.boxShadow='0 4px 20px rgba(0,0,0,0.02)'">
                    <div style="width: 56px; height: 56px; border-radius: 16px; background: rgba(255, 167, 38, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="fas fa-crown"></i>
                    </div>
                    <div>
                        <div style="font-size: 0.85rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Premium</div>
                        <div style="font-size: 2rem; font-weight: 800; color: #1e293b; line-height: 1;">${premiumUsers}</div>
                    </div>
                </div>
            </div>

            <!-- Management Module -->
            <div style="background: white; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 4px 24px rgba(0,0,0,0.03); overflow: hidden;">
                <!-- Filter & Action Bar -->
                <div style="padding: 24px; border-bottom: 1.5px solid var(--border-color); display: flex; gap: 16px; flex-wrap: wrap; align-items: center; background: #fafbfc;">
                    <div style="flex: 1; min-width: 250px; position: relative;">
                        <i class="fas fa-search" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem;"></i>
                        <input type="text" id="admin-user-search" placeholder="Tìm bằng tên, email..." style="width: 100%; padding: 14px 16px 14px 46px; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 0.95rem; outline: none; transition: all 0.2s; box-sizing: border-box;" onfocus="this.style.borderColor='var(--primary-color)'; this.style.boxShadow='0 0 0 3px rgba(255,167,38,0.1)'" onblur="this.style.borderColor='#e2e8f0'; this.style.boxShadow='none'" onkeyup="window.filterAdminUsers()">
                    </div>
                    <select id="admin-filter-role" style="padding: 14px 20px; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 0.95rem; font-weight: 600; outline: none; background: white; color: #475569; cursor: pointer; transition: all 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'" onchange="window.filterAdminUsers()">
                        <option value="all">Tất cả Vai trò</option>
                        <option value="user">Người dùng (User)</option>
                        <option value="admin">Quản trị viên (Admin)</option>
                    </select>
                    <select id="admin-filter-plan" style="padding: 14px 20px; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 0.95rem; font-weight: 600; outline: none; background: white; color: #475569; cursor: pointer; transition: all 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'" onchange="window.filterAdminUsers()">
                        <option value="all">Tất cả Gói</option>
                        <option value="free">Gói Miễn Phí (Free)</option>
                        <option value="premium">Gói Cao Cấp (Premium)</option>
                    </select>
                    <select id="admin-filter-status" style="padding: 14px 20px; border: 1.5px solid #e2e8f0; border-radius: 14px; font-size: 0.95rem; font-weight: 600; outline: none; background: white; color: #475569; cursor: pointer; transition: all 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'" onchange="window.filterAdminUsers()">
                        <option value="all">Tất cả Trạng thái</option>
                        <option value="active">Đang hoạt động</option>
                        <option value="locked">Bị Khóa (Locked)</option>
                    </select>
                </div>

                <!-- Data Table -->
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse; min-width: 900px;">
                        <thead style="background: white;">
                            <tr style="text-align: left; border-bottom: 2px solid #f1f5f9;">
                                <th style="padding: 20px 24px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; width: 35%;">Thông Tin Tài Khoản</th>
                                <th style="padding: 20px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; width: 15%;">Vai Trò</th>
                                <th style="padding: 20px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; width: 15%;">Gói Đăng Ký</th>
                                <th style="padding: 20px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; width: 15%;">Trạng Thái</th>
                                <th style="padding: 20px 24px; font-size: 0.8rem; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.5px; text-align: right; width: 20%;">Hành Động</th>
                            </tr>
                        </thead>
                        <tbody id="admin-users-table-body">
                            <!-- JS Will Render Content Here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add User Modal -->
            <div id="admin-add-user-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 1000; align-items: center; justify-content: center; backdrop-filter: blur(4px); animation: fadeIn 0.2s;">
                <div style="background: white; width: 100%; max-width: 500px; border-radius: 24px; padding: 32px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); animation: slideUp 0.3s ease;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h2 style="margin: 0; font-size: 1.5rem; font-weight: 800; color: #1e293b;">Thêm User Mới</h2>
                        <button onclick="window.adminCloseAddUserModal()" style="background: none; border: none; font-size: 1.8rem; color: #94a3b8; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#94a3b8'">&times;</button>
                    </div>
                    <form id="admin-add-user-form" onsubmit="window.adminSubmitNewUser(event)">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569;">Tên người dùng (Username) <span style="color: red;">*</span></label>
                            <input type="text" id="add-user-username" required style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569;">Email <span style="color: red;">*</span></label>
                            <input type="email" id="add-user-email" required style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569;">Mật khẩu <span style="color: red;">*</span></label>
                            <input type="password" id="add-user-password" required style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; transition: 0.2s;" onfocus="this.style.borderColor='var(--primary-color)'" onblur="this.style.borderColor='#e2e8f0'">
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569;">Vai trò</label>
                                <select id="add-user-role" style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; cursor: pointer; background: white;">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; margin-bottom: 8px; font-size: 0.9rem; font-weight: 700; color: #475569;">Gói đăng ký</label>
                                <select id="add-user-plan" style="width: 100%; box-sizing: border-box; padding: 12px 16px; border-radius: 12px; border: 1.5px solid #e2e8f0; font-size: 0.95rem; outline: none; cursor: pointer; background: white;">
                                    <option value="free">Free</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" style="width: 100%; padding: 14px; background: var(--primary-color); color: white; border: none; border-radius: 14px; font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(255, 167, 38, 0.35); transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                            Xác Nhận Tạo
                        </button>
                    </form>
                </div>
            </div>
        `;
    };

    const renderAIMonitoring = async () => {
        const logs = await fetchData('/api/admin/logs');
        const config = await fetchData('/api/admin/config/ai-prompt');
        const aiKeys = await fetchData('/api/admin/config/ai-keys') || [];

        return `
            <div class="header" style="margin-bottom: 32px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Giám sát & Điều phối AI</h1>
                <p style="color: var(--text-muted); margin: 0; font-size: 0.95rem;">Cấu hình, phân bổ tải vòng lặp (Load Balancing) và giám sát nhật ký trò chuyện hệ thống</p>
            </div>

            <!-- API Keys Management Hub -->
            <div style="margin-bottom: 32px; background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.02);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 48px; height: 48px; background: rgba(76, 175, 80, 0.1); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #4CAF50; font-size: 1.3rem;">
                            <i class="fas fa-key"></i>
                        </div>
                        <div>
                            <h3 style="margin: 0; font-size: 1.3rem; font-weight: 800; color: #1e293b;">Groq API Keys (Rate Limit Management)</h3>
                            <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">Hệ thống chia tải thông minh, tự động xoay vòng ${aiKeys.length} slot được cấu hình</p>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                    ${aiKeys.map(k => `
                        <div style="border: 1.5px solid ${k.status === 'active' ? '#e2e8f0' : '#fee2e2'}; border-radius: 16px; padding: 20px; background: ${k.status === 'active' ? '#ffffff' : '#fef2f2'}; position: relative; overflow: hidden; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.01);" onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='0 8px 25px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.01)'">
                            ${k.status === 'active' ? `<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #22c55e;"></div>` : `<div style="position: absolute; top: 0; left: 0; width: 4px; height: 100%; background: #ef4444;"></div>`}
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; padding-left: 8px;">
                                <div>
                                    <div style="font-weight: 800; font-size: 1.1rem; color: #1e293b; margin-bottom: 6px;">Slot ${k.id}</div>
                                    <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; background: ${k.status === 'active' ? '#f1f5f9' : '#fecaca'}; padding: 4px 10px; border-radius: 8px; color: ${k.status === 'active' ? '#475569' : '#991b1b'}; display: inline-block; font-weight: 600; letter-spacing: 0.5px;">
                                        ${k.maskedKey}
                                    </div>
                                </div>
                                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 20px; background: ${k.status === 'active' ? '#ecfdf5' : '#fee2e2'}; color: ${k.status === 'active' ? '#10b981' : '#b91c1c'}; border: 1px solid ${k.status === 'active' ? '#a7f3d0' : '#fca5a5'}; text-transform: uppercase; letter-spacing: 0.5px;">
                                    <span style="position: relative; width: 6px; height: 6px; border-radius: 50%; background: ${k.status === 'active' ? '#10b981' : '#ef4444'}; display: inline-block;">
                                        ${k.status === 'active' ? `<span style="position: absolute; inset: 0; background: #10b981; border-radius: 50%; animation: ping 1.5s infinite; opacity: 0.6;"></span>` : ''}
                                    </span>
                                    ${k.status === 'active' ? 'Active' : 'Unused'}
                                </div>
                            </div>
                            
                            <!-- Circular Progress Bar -->
                            <div style="padding-left: 8px; display: flex; align-items: center; gap: 16px; margin-top: 16px;">
                                <div style="position: relative; width: 56px; height: 56px; flex-shrink: 0;">
                                    <svg viewBox="0 0 36 36" style="width: 100%; height: 100%; transform: rotate(-90deg);">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${k.status === 'active' ? '#e2e8f0' : '#fecaca'}" stroke-width="3.5" />
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="${k.status === 'active' ? '#3b82f6' : '#ef4444'}" stroke-width="3.5" stroke-dasharray="${k.status === 'active' ? Math.max((k.remainingReqs / (k.limitReqs || 14400)) * 100, 0) : 0}, 100" stroke-linecap="round" style="transition: stroke-dasharray 1.5s cubic-bezier(0.4, 0, 0.2, 1);" />
                                    </svg>
                                    <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800; color: ${k.status === 'active' ? '#1e293b' : '#94a3b8'};">
                                        ${k.status === 'active' ? Math.round((k.remainingReqs / (k.limitReqs || 14400)) * 100) : 0}%
                                    </div>
                                </div>
                                <div style="display: flex; flex-direction: column; justify-content: center;">
                                    <div style="font-size: 0.7rem; font-weight: 800; color: #64748b; text-transform: uppercase; margin-bottom: 2px;">Remaining T/R Quota</div>
                                    <div style="font-size: 1.05rem; font-weight: 800; color: ${k.status === 'active' ? '#1e293b' : '#94a3b8'};">
                                        ${k.remainingReqs.toLocaleString()} <span style="font-size: 0.75rem; color: #94a3b8; font-weight: 600;">/ ${k.limitReqs || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
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

    const renderStats = async () => {
        const stats = await fetchData('/api/admin/stats');
        if (!stats) return '<div class="header"><h1>Lỗi tải báo cáo</h1></div>';

        const { summary, growth } = stats;
        const maxGrowth = growth.length > 0 ? growth.reduce((max, g) => g.count > max ? g.count : max, 1) : 1;

        return `
            <div class="header" style="margin-bottom: 32px;">
                <h1 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">Hiệu Suất & Thống Kê</h1>
                <p style="color: var(--text-muted); margin: 0; font-size: 0.95rem;">Theo dõi tăng trưởng, tương tác hệ thống và sức khỏe nền tảng PlanBee</p>
            </div>

            <!-- Health & Activity KPIs -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 32px;">
                <div style="background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 20px; padding: 24px; color: white; display: flex; flex-direction: column; justify-content: space-between; position: relative; box-shadow: 0 10px 30px rgba(15,23,42,0.15); overflow: hidden;">
                    <i class="fas fa-bolt" style="position: absolute; top: 10px; right: -15px; font-size: 5rem; color: rgba(255,255,255,0.05); transform: rotate(15deg);"></i>
                    <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px;">Active Tasks (24H)</div>
                    <div style="font-size: 2.2rem; font-weight: 900; color: #38bdf8;">${summary.activeTasks24h.toLocaleString()}</div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 24px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px;">Tương tác AI (Total)</div>
                    <div style="display: flex; align-items: flex-end; justify-content: space-between;">
                        <div style="font-size: 2.2rem; font-weight: 900; color: #1e293b;">${summary.totalAIInteractions.toLocaleString()}</div>
                        <div style="width: 48px; height: 48px; background: rgba(255,167,38,0.1); border-radius: 50%; color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.4rem;"><i class="fas fa-brain"></i></div>
                    </div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 24px; border: 1.5px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 12px;">Users Premium</div>
                    <div style="display: flex; align-items: flex-end; justify-content: space-between;">
                        <div style="font-size: 2.2rem; font-weight: 900; color: #1e293b;">${summary.premiumUsers.toLocaleString()}</div>
                        <div style="width: 48px; height: 48px; background: rgba(34,197,94,0.1); border-radius: 50%; color: #22c55e; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;"><i class="fas fa-crown"></i></div>
                    </div>
                </div>

                <div style="background: white; border-radius: 20px; padding: 24px; border: 1.5px solid ${summary.systemErrors > 0 ? '#fecaca' : 'var(--border-color)'}; display: flex; flex-direction: column; justify-content: space-between;">
                    <div style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: ${summary.systemErrors > 0 ? '#dc2626' : 'var(--text-muted)'}; margin-bottom: 12px;">System Errors</div>
                    <div style="display: flex; align-items: flex-end; justify-content: space-between;">
                        <div style="font-size: 2.2rem; font-weight: 900; color: ${summary.systemErrors > 0 ? '#dc2626' : '#1e293b'};">${summary.systemErrors}</div>
                        <div style="width: 48px; height: 48px; background: rgba(239,68,68,0.1); border-radius: 50%; color: #ef4444; display: flex; align-items: center; justify-content: center; font-size: 1.4rem;"><i class="fas fa-bug"></i></div>
                    </div>
                </div>
            </div>

            <!-- Complex Grid -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px;" class="complex-grid-stats">
                <!-- Growth Chart -->
                <div style="background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Tăng trưởng người dùng 30 ngày</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 32px;">Biểu đồ thống kê lượt tạo tài khoản mới</p>
                    
                    ${growth.length > 0 ? `
                        <div style="flex: 1; display: flex; align-items: flex-end; gap: 6px; height: 260px; padding-bottom: 24px; border-bottom: 1.5px solid #f1f5f9; overflow-x: auto; overflow-y: hidden;">
                            ${growth.map(g => {
                                const barHeight = Math.max((g.count / maxGrowth) * 100, 5);
                                return `
                                    <div style="flex: 1; min-width: 28px; display: flex; flex-direction: column; align-items: center; gap: 6px;">
                                        <div style="font-size: 0.65rem; color: #1e293b; font-weight: 800; opacity: 0; transform: translateY(4px); transition: all 0.2s; position: absolute; margin-top: -20px;" class="chart-val">${g.count}</div>
                                        <div style="width: 100%; max-width: 32px; height: ${barHeight}%; background: linear-gradient(180deg, var(--primary-color) 0%, rgba(255,167,38,0.1) 100%); border-radius: 6px 6px 0 0; border: 1px solid rgba(255,167,38,0.2); border-bottom: none; transition: all 0.3s; cursor: pointer;" onmouseover="this.style.opacity=0.8; this.previousElementSibling.style.opacity=1; this.previousElementSibling.style.transform='translateY(0)'" onmouseout="this.style.opacity=1; this.previousElementSibling.style.opacity=0; this.previousElementSibling.style.transform='translateY(4px)'"></div>
                                        <div style="font-size: 0.55rem; color: #94a3b8; font-weight: 700; white-space: nowrap; transform: rotate(-45deg); margin-top: 14px; text-align: left; width: 100%; padding-left: 2px;">${g.date.slice(5,10)}</div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    ` : '<div style="flex: 1; display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 700; font-size: 0.9rem;"><i class="fas fa-chart-line" style="margin-right: 8px;"></i> Chưa có dữ liệu tăng trưởng.</div>'}
                </div>

                <!-- Distribution Overview -->
                <div style="background: white; padding: 32px; border-radius: 24px; border: 1.5px solid var(--border-color); box-shadow: 0 10px 40px rgba(0,0,0,0.02); display: flex; flex-direction: column;">
                    <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Phân bổ Hệ sinh thái</h3>
                    <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 32px;">Toàn bộ dữ liệu tương tác cốt lõi</p>

                    <div style="display: flex; flex-direction: column; gap: 28px;">
                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #475569; margin-bottom: 10px;">
                                <span><i class="fas fa-check-circle" style="color: var(--success); margin-right: 8px;"></i> Tasks/Todo</span>
                                <span>${summary.totalTasks.toLocaleString()}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;"><div style="width: 80%; height: 100%; background: var(--success); border-radius: 10px; box-shadow: 0 2px 6px rgba(16,185,129,0.3);"></div></div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #475569; margin-bottom: 10px;">
                                <span><i class="far fa-calendar-alt" style="color: #38bdf8; margin-right: 8px;"></i> Event Plans</span>
                                <span>${summary.totalPlans.toLocaleString()}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;"><div style="width: 65%; height: 100%; background: #38bdf8; border-radius: 10px; box-shadow: 0 2px 6px rgba(56,189,248,0.3);"></div></div>
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #475569; margin-bottom: 10px;">
                                <span><i class="fas fa-bolt" style="color: var(--primary-color); margin-right: 8px;"></i> Kỷ luật (Habits)</span>
                                <span>${summary.totalHabits.toLocaleString()}</span>
                            </div>
                            <div style="width: 100%; height: 8px; background: #f1f5f9; border-radius: 10px; overflow: hidden;"><div style="width: 45%; height: 100%; background: var(--primary-color); border-radius: 10px; box-shadow: 0 2px 6px rgba(255,167,38,0.3);"></div></div>
                        </div>
                    </div>
                    
                    <div style="margin-top: auto; padding-top: 24px; border-top: 1.5px dashed #e2e8f0;">
                        <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700; display: flex; justify-content: space-between;">
                            <span>Độ gắn kết (Engagement)</span>
                            <span style="font-weight: 800; color: #1e293b;">~${summary.avgTasks} tasks / user</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                @media (max-width: 900px) {
                    .complex-grid-stats { grid-template-columns: 1fr !important; }
                }
            </style>
        `;
    };

    // --- Main Rendering ---

    let contentHTML = '';
    switch (subPage) {
        case 'dashboard': contentHTML = await renderOverview(); break;
        case 'users': contentHTML = await renderUserManagement(); break;
        case 'ai': contentHTML = await renderAIMonitoring(); break;
        case 'notifications': contentHTML = await renderNotifications(); break;
        case 'stats': contentHTML = await renderStats(); break;
        default: contentHTML = await renderOverview();
    }

    container.innerHTML = `
        <div class="admin-view-wrapper" style="padding: 32px; animation: fadeIn 0.4s ease;">
            ${contentHTML}
        </div>
    `;

    // --- Dynamic Handlers ---

    window.renderAdminUserRows = (usersToRender) => {
        const tbody = document.getElementById('admin-users-table-body');
        if (!tbody) return;

        if (usersToRender.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 60px; color: #94a3b8; font-size: 0.95rem; font-weight: 600;"><i class="fas fa-search" style="font-size: 2rem; color: #cbd5e1; display: block; margin-bottom: 16px;"></i>Không tìm thấy người dùng nào phù hợp.</td></tr>';
            return;
        }

        tbody.innerHTML = usersToRender.map(u => {
            const avatarColor = u.is_active ? 'var(--primary-color)' : '#94a3b8';
            const avatarBg = u.is_active ? 'rgba(255, 167, 38, 0.1)' : '#f1f5f9';
            const avatarLetter = u.username.charAt(0).toUpperCase();
            
            return `
                <tr style="border-bottom: 1px solid #f1f5f9; transition: background 0.2s;" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background='white'">
                    <td style="padding: 16px 24px; display: flex; align-items: center; gap: 16px;">
                        <div style="width: 48px; height: 48px; border-radius: 50%; background: ${avatarBg}; color: ${avatarColor}; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.25rem; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); flex-shrink: 0;">
                            ${avatarLetter}
                        </div>
                        <div style="overflow: hidden;">
                            <div style="font-weight: 800; color: #1e293b; font-size: 1rem; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.username}</div>
                            <div style="font-size: 0.85rem; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${u.email}</div>
                        </div>
                    </td>
                    <td style="padding: 16px 20px;">
                        <span style="padding: 6px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 800; background: ${u.role === 'admin' ? '#fee2e2' : '#f1f5f9'}; color: ${u.role === 'admin' ? '#ef4444' : '#64748b'}; text-transform: capitalize; letter-spacing: 0.5px; border: 1px solid ${u.role === 'admin' ? '#fecaca' : '#e2e8f0'}; display: inline-block;">
                            ${u.role}
                        </span>
                    </td>
                    <td style="padding: 16px 20px;">
                        <span style="display: inline-flex; align-items: center; gap: 8px; font-weight: 700; font-size: 0.9rem; color: ${u.account_type === 'premium' ? 'var(--primary-color)' : '#64748b'}; text-transform: capitalize; background: ${u.account_type === 'premium' ? 'rgba(255,167,38,0.05)' : 'transparent'}; padding: 4px 10px; border-radius: 8px;">
                            ${u.account_type === 'premium' ? '<i class="fas fa-crown" style="font-size: 0.8rem;"></i>' : ''}${u.account_type}
                        </span>
                    </td>
                    <td style="padding: 16px 20px;">
                        <div style="display: flex; align-items: center; gap: 10px; background: ${u.is_active ? '#ecfdf5' : '#fef2f2'}; padding: 6px 14px; border-radius: 20px; display: inline-flex; border: 1px solid ${u.is_active ? '#a7f3d0' : '#fecaca'};">
                            <span style="position: relative; width: 8px; height: 8px; background: ${u.is_active ? '#10b981' : '#ef4444'}; border-radius: 50%; display: inline-block;">
                                ${u.is_active ? `<span style="position: absolute; inset: 0; background: #10b981; border-radius: 50%; animation: ping 1.5s infinite; opacity: 0.6;"></span>` : ''}
                            </span>
                            <span style="font-weight: 800; font-size: 0.8rem; color: ${u.is_active ? '#059669' : '#dc2626'}; text-transform: uppercase; letter-spacing: 0.5px;">
                                ${u.is_active ? 'Active' : 'Locked'}
                            </span>
                        </div>
                    </td>
                    <td style="padding: 16px 24px; text-align: right;">
                        <button onclick="window.adminToggleUser(${u.id}, ${u.is_active})" style="padding: 10px 18px; border-radius: 12px; border: 1.5px solid ${u.is_active ? '#fee2e2' : '#ecfdf5'}; background: ${u.is_active ? '#fef2f2' : '#f0fdf4'}; color: ${u.is_active ? '#ef4444' : '#10b981'}; cursor: pointer; font-weight: 800; font-size: 0.85rem; transition: all 0.2s; box-shadow: 0 2px 8px ${u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}; display: inline-flex; align-items: center; gap: 8px;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px ${u.is_active ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px ${u.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}'">
                            ${u.is_active ? '<i class="fas fa-lock"></i> Khóa' : '<i class="fas fa-unlock"></i> Mở Khóa'}
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    };

    window.filterAdminUsers = () => {
        const searchRaw = document.getElementById('admin-user-search')?.value.toLowerCase() || '';
        const roleFilter = document.getElementById('admin-filter-role')?.value || 'all';
        const planFilter = document.getElementById('admin-filter-plan')?.value || 'all';
        const statusFilter = document.getElementById('admin-filter-status')?.value || 'all';

        if (!window.adminUsersData) return;

        const filtered = window.adminUsersData.filter(u => {
            const matchSearch = u.username.toLowerCase().includes(searchRaw) || u.email.toLowerCase().includes(searchRaw);
            const matchRole = roleFilter === 'all' || u.role === roleFilter;
            const matchPlan = planFilter === 'all' || u.account_type === planFilter;
            const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.is_active : !u.is_active);
            
            return matchSearch && matchRole && matchPlan && matchStatus;
        });

        window.renderAdminUserRows(filtered);
    };

    // Trigger initial render for users page
    if (subPage === 'users') {
        setTimeout(() => {
            if (window.adminUsersData) {
                window.renderAdminUserRows(window.adminUsersData);
            }
        }, 50);
    }

    // Modal Handlers
    window.adminOpenAddUserModal = () => {
        const modal = document.getElementById('admin-add-user-modal');
        if (modal) {
            modal.style.display = 'flex';
            document.getElementById('add-user-username').value = '';
            document.getElementById('add-user-email').value = '';
            document.getElementById('add-user-password').value = '';
            document.getElementById('add-user-role').value = 'user';
            document.getElementById('add-user-plan').value = 'free';
        }
    };

    window.adminCloseAddUserModal = () => {
        const modal = document.getElementById('admin-add-user-modal');
        if (modal) modal.style.display = 'none';
    };

    window.adminSubmitNewUser = async (e) => {
        e.preventDefault();
        const username = document.getElementById('add-user-username').value;
        const email = document.getElementById('add-user-email').value;
        const password = document.getElementById('add-user-password').value;
        const role = document.getElementById('add-user-role').value;
        const account_type = document.getElementById('add-user-plan').value;

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ username, email, password, role, account_type, is_active: 1 })
            });
            const data = await res.json();
            if (res.ok) {
                alert(data.message || 'Tạo user thành công!');
                window.adminCloseAddUserModal();
                renderAdminDashboard(container, activePage, params);
            } else {
                alert(data.message || 'Có lỗi xảy ra!');
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi kết nối!');
        }
    };

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
