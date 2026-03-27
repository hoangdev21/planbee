export const renderSettings = (container) => {
    container.innerHTML = `
        <div class="settings-root fade-in">
            <h2 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 32px;">Cài đặt hệ thống</h2>

            <div class="settings-grid" style="display: grid; grid-template-columns: 1fr 2fr; gap: 40px;">
                <!-- Settings Menu -->
                <div class="settings-menu" style="display: flex; flex-direction: column; gap: 8px;">
                    <a href="#" class="settings-nav-item active" style="padding: 12px 16px; border-radius: 8px; background: var(--primary-light); color: var(--primary-color); font-weight: 700; text-decoration: none;">Thông tin cá nhân</a>
                    <a href="#" class="settings-nav-item" style="padding: 12px 16px; border-radius: 8px; color: var(--text-muted); font-weight: 600; text-decoration: none;">Đổi mật khẩu</a>
                    <a href="#" class="settings-nav-item" style="padding: 12px 16px; border-radius: 8px; color: var(--text-muted); font-weight: 600; text-decoration: none;">Thông báo</a>
                    <a href="#" class="settings-nav-item" style="padding: 12px 16px; border-radius: 8px; color: var(--text-muted); font-weight: 600; text-decoration: none;">Giao diện & Chủ đề</a>
                    <a href="#" class="settings-nav-item" style="padding: 12px 16px; border-radius: 8px; color: var(--text-muted); font-weight: 600; text-decoration: none;">Bảo mật & Quyền riêng tư</a>
                    <a href="#" class="settings-nav-item" style="padding: 12px 16px; border-radius: 8px; color: var(--danger); font-weight: 600; text-decoration: none; border-top: 1px solid var(--border-color); margin-top: 16px;">Xóa tài khoản</a>
                </div>

                <!-- Settings Content Card -->
                <div class="settings-card" style="padding: 32px; background: var(--card-bg); border-radius: 16px; border: 1px solid var(--border-color);">
                    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 32px;">
                        <div style="position: relative;">
                            <div style="width: 100px; height: 100px; border-radius: 50%; background: var(--primary-color); display: flex; align-items: center; justify-content: center; color: white; border: 4px solid var(--border-color);">
                                <i class="fas fa-user" style="font-size: 3rem;"></i>
                            </div>
                            <button style="position: absolute; bottom: 0; right: 0; padding: 10px; border-radius: 50%; background: var(--header-bg); border: 1px solid var(--border-color); color: var(--primary-color); font-size: 0.8rem; box-shadow: var(--shadow-md);">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <h4 style="font-size: 1.25rem; font-weight: 700;">Admin User</h4>
                            <p style="font-size: 0.9rem; color: var(--text-muted);">Cập nhật ảnh đại diện và thông tin cá nhân của bạn tại đây.</p>
                        </div>
                    </div>

                    <form id="settings-form" style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                        <div class="form-group">
                            <label>Họ và tên</label>
                            <input type="text" value="Admin User" style="padding: 12px; border-radius: 8px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); font-family: inherit;">
                        </div>
                        <div class="form-group">
                            <label>Tên đăng nhập</label>
                            <input type="text" value="admin_user" style="padding: 12px; border-radius: 8px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); font-family: inherit;" readonly>
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Email liên hệ</label>
                            <input type="email" value="admin@planbee.vn" style="padding: 12px; border-radius: 8px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); font-family: inherit;">
                        </div>
                        <div class="form-group" style="grid-column: span 2;">
                            <label>Mô tả bản thân</label>
                            <textarea rows="4" style="padding: 12px; border-radius: 8px; background: var(--input-bg); border: 1px solid var(--border-color); color: var(--text-main); font-family: inherit; resize: vertical;">Quản trị viên hệ thống PlanBee. Yêu thích sự gọn gàng và hiệu quả.</textarea>
                        </div>
                        
                        <div style="grid-column: span 2; display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px;">
                            <button type="button" class="btn btn-outline">Hủy bỏ</button>
                            <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
};
