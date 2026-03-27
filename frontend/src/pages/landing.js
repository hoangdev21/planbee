export const renderLanding = (container) => {
    container.innerHTML = `
        <div class="landing-hero fade-in">
            <div class="logo" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 2rem;">
                <i class="fas fa-bee"></i>
            </div>
            <h1>PlanBee</h1>
            <p>Hệ thống lập kế hoạch và quản lý công việc chuyên nghiệp. Giúp bạn tối ưu hóa thời gian và năng suất làm việc mỗi ngày.</p>
            <div class="cta-group">
                <a href="#/register" class="btn btn-primary">Bắt đầu ngay</a>
                <a href="#/login" class="btn btn-outline">Đăng nhập</a>
            </div>
            
            <div class="features-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-top: 4rem; max-width: 1000px; width: 100%;">
                <div class="feature-card" style="padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
                    <i class="fas fa-tasks" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700;">Quản lý nhiệm vụ</h3>
                    <p style="color: var(--text-muted);">Tạo và theo dõi các nhiệm vụ quan trọng trong ngày của bạn một cách dễ dàng.</p>
                </div>
                <div class="feature-card" style="padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
                    <i class="fas fa-calendar-alt" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700;">Lập kế hoạch</h3>
                    <p style="color: var(--text-muted);">Sắp xếp lịch trình theo ngày, tuần, tháng với giao diện lịch trực quan.</p>
                </div>
                <div class="feature-card" style="padding: 2rem; background: var(--card-bg); border-radius: 12px; border: 1px solid var(--border-color); text-align: left;">
                    <i class="fas fa-chart-line" style="font-size: 2rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem; font-weight: 700;">Thói quen</h3>
                    <p style="color: var(--text-muted);">Xây dựng những thói quen tốt và theo dõi quá trình thực hiện một cách khoa học.</p>
                </div>
            </div>
        </div>
    `;
};
