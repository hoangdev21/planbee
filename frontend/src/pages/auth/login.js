import { navigate } from '../../../main.js';
import api from '../../utils/api.js';

export const renderLogin = (container) => {
    container.innerHTML = `
        <div class="auth-container fade-in">
            <div class="auth-card">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 1rem;">
                        <i class="fas fa-bee"></i>
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 700;">Đăng nhập PlanBee</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Chào mừng bạn trở lại! Vui lòng nhập thông tin.</p>
                </div>
                
                <form id="login-form">
                    <div id="auth-error" style="display: none; padding: 12px; border-radius: 8px; background: rgba(214, 48, 49, 0.1); color: var(--danger); font-size: 0.85rem; margin-bottom: 1rem; text-align: center;"></div>
                    <div class="form-group">
                        <label>Email hoặc Tên đăng nhập</label>
                        <input type="text" id="username" placeholder="Nhập email hoặc tên đăng nhập" required>
                    </div>
                    <!-- Rest of the form stays same -->
                    <div class="form-group">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <label style="margin-bottom: 0;">Mật khẩu</label>
                            <a href="#" style="font-size: 0.8rem; color: var(--primary-color); font-weight: 500;">Quên mật khẩu?</a>
                        </div>
                        <input type="password" id="password" placeholder="••••••••" required>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem;">
                        <input type="checkbox" id="remember">
                        <label for="remember" style="font-size: 0.85rem; font-weight: normal; margin-bottom: 0; cursor: pointer;">Ghi nhớ đăng nhập</label>
                    </div>

                    <button type="submit" id="login-btn" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 0.95rem; margin-bottom: 1.5rem;">Đăng nhập</button>
                    
                    <div style="text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                        Chưa có tài khoản? <a href="#/register" style="color: var(--primary-color); font-weight: 600;">Đăng ký ngay</a>
                    </div>
                </form>
            </div>
        </div>
    `;

    const loginForm = document.getElementById('login-form');
    const errorEl = document.getElementById('auth-error');
    const loginBtn = document.getElementById('login-btn');

    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        loginBtn.disabled = true;
        loginBtn.innerText = 'Đang xử lý...';

        try {
            const username = loginForm.username.value;
            const password = loginForm.password.value;
            
            const data = await api.post('/auth/login', { username, password });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            const theme = data.settings.theme || 'light';
            const accent_color = data.settings.accent_color || '#FFA726';
            
            localStorage.setItem('theme', theme);
            localStorage.setItem('accent_color', accent_color);
            
            // Dispatch events to update main.js state and DOM
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme } }));
            window.dispatchEvent(new CustomEvent('accent-color-changed', { detail: { color: accent_color } }));
            
            navigate('#/dashboard');
        } catch (error) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
            loginBtn.disabled = false;
            loginBtn.innerText = 'Đăng nhập';
        }
    };
};
