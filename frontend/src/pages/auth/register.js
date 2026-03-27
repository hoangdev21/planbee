import { navigate } from '../../../main.js';
import api from '../../utils/api.js';

export const renderRegister = (container) => {
    container.innerHTML = `
        <div class="auth-container fade-in">
            <div class="auth-card">
                <div style="text-align: center; margin-bottom: 2rem; position: relative;">
                    <a href="#/" style="position: absolute; top: 0; left: 0; font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-weight: 600; transition: 0.2s;" onmouseover="this.style.color='var(--brand-orange)'" onmouseout="this.style.color='var(--text-muted)'">
                        <i class="fas fa-arrow-left"></i> Trang chủ
                    </a>
                    <div style="font-size: 2.5rem; color: var(--primary-color); margin-bottom: 1rem;">
                        <img src="/logo.png" alt="PlanBee Logo" style="width: 60px; height: auto;">
                    </div>
                    <h2 style="font-size: 1.5rem; font-weight: 700;">Đăng ký PlanBee</h2>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Bắt đầu hành trình tăng năng suất ngay hôm nay!</p>
                </div>
                
                <form id="register-form">
                    <div id="auth-error" style="display: none; padding: 12px; border-radius: 8px; background: rgba(214, 48, 49, 0.1); color: var(--danger); font-size: 0.85rem; margin-bottom: 1rem; text-align: center;"></div>
                    <div class="form-group row" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div>
                            <label>Email</label>
                            <input type="email" id="email" placeholder="Nhập địa chỉ email" required>
                        </div>
                        <div>
                            <label>Tên đăng nhập</label>
                            <input type="text" id="username" placeholder="Username" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Mật khẩu</label>
                        <input type="password" id="password" placeholder="••••••••" required>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 1.5rem;">
                        <input type="checkbox" id="terms" required>
                        <label for="terms" style="font-size: 0.85rem; font-weight: normal; margin-bottom: 0; cursor: pointer;">Tôi đồng ý với <a href="#" style="color: var(--primary-color); font-weight: 500;">Điều khoản dịch vụ</a></label>
                    </div>

                    <button type="submit" id="register-btn" class="btn btn-primary" style="width: 100%; padding: 14px; font-size: 0.95rem; margin-bottom: 1.5rem;">Đăng ký</button>
                    
                    <div style="text-align: center; font-size: 0.9rem; color: var(--text-muted);">
                        Đã có tài khoản? <a href="#/login" style="color: var(--primary-color); font-weight: 600;">Đăng nhập</a>
                    </div>
                </form>
            </div>
        </div>
    `;

    const registerForm = document.getElementById('register-form');
    const errorEl = document.getElementById('auth-error');
    const registerBtn = document.getElementById('register-btn');

    registerForm.onsubmit = async (e) => {
        e.preventDefault();
        errorEl.style.display = 'none';
        registerBtn.disabled = true;
        registerBtn.innerText = 'Đăng xử lý...';

        try {
            const email = registerForm.email.value;
            const username = registerForm.username.value;
            const password = registerForm.password.value;
            
            const data = await api.post('/auth/register', { email, username, password });
            
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            navigate('#/dashboard');
        } catch (error) {
            errorEl.innerText = error.message;
            errorEl.style.display = 'block';
            registerBtn.disabled = false;
            registerBtn.innerText = 'Đăng ký';
        }
    };
};
