import '../styles/landing.css';

export const renderLanding = (container) => {
    container.innerHTML = `
        <div class="landing-page">
            <!-- Decorative Background blobs -->
            <div class="blob" style="top: 10%; left: 5%;"></div>
            <div class="blob" style="bottom: 20%; right: 10%; background: #4F46E5;"></div>

            <!-- Pre-Header Spacing -->
            <div style="height: 40px;"></div>

            <!-- Modern Navigation -->
            <nav id="landing-nav" class="landing-nav reveal">
                <div class="nav-logo" style="display: flex; align-items: center; gap: 12px;">
                    <img src="/logo.png" alt="PlanBee Logo" style="height: 40px; width: auto; object-fit: contain; cursor: pointer;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <span style="font-weight: 900; letter-spacing: -1px; font-size: 1.2rem; color: var(--brand-dark);">PlanBee</span>
                </div>
                <div class="nav-actions" style="gap: 16px;">
                    ${localStorage.getItem('token') && localStorage.getItem('token') !== 'null' ? `
                        <a href="#/dashboard" class="btn-premium btn-primary-orange" style="padding: 8px 16px; font-size: 0.8rem;">Truy cập Dashboard</a>
                        <a href="#" id="landing-logout" style="color: var(--brand-text-muted); font-size: 0.75rem; font-weight: 700; text-decoration: none; opacity: 0.7; white-space: nowrap;">Đăng xuất</a>
                    ` : `
                        <a href="#/login" style="color: var(--brand-text-muted); font-size: 0.85rem; font-weight: 700; text-decoration: none; white-space: nowrap;">Đăng nhập</a>
                        <a href="#/register" class="btn-premium btn-primary-orange" style="padding: 8px 16px; font-size: 0.8rem; white-space: nowrap;">Dùng thử ngay</a>
                    `}
                </div>
            </nav>

            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-content reveal">
                    <div class="hero-badge">Next-Gen Interface</div>
                    <h1 class="hero-title">
                        Kiến tạo tương lai<br>cùng <span>BeeAI</span>
                    </h1>
                    <p class="hero-desc">
                        Nâng tầm hiệu suất gấp 3 lần với hệ thống quản lý lịch trình thông minh. BeeAI tối ưu hóa mọi thứ cho bạn chỉ trong 1 giây.
                    </p>
                    <div class="hero-btns">
                        <a href="#/register" class="btn-premium btn-primary-orange" style="padding: 12px 28px;">Bắt đầu ngay</a>
                        <a href="#how-it-works" class="btn-premium btn-secondary-white" style="padding: 12px 28px; font-weight: 800;">Tìm hiểu thêm</a>
                    </div>
                    <div style="margin-top: 32px; display: flex; align-items: center; gap: 12px; opacity: 0.5;">
                        <span style="font-size: 0.7rem; font-weight: 800; letter-spacing: 1px;">TRUSTED BY INNOVATORS</span>
                        <div style="height: 1px; flex: 1; background: var(--glass-border);"></div>
                    </div>
                </div>
                <div class="hero-visual reveal">
                    <div class="hero-img-container">
                        <img src="/hero-mockup.png" alt="PlanBee Dash">
                    </div>
                </div>
            </section>

            <!-- How it works -->
            <section id="how-it-works" class="staircase-section">
                <div class="section-header reveal" style="text-align: center; margin-bottom: 100px;">
                    <h2 class="step-title" style="font-size: 3rem;">Quy trình 3 bước<br>đến sự <span>Hoàn hảo</span></h2>
                </div>

                <div class="staircase-step reveal">
                    <div class="step-info">
                        <span class="step-number">01. KẾT NỐI</span>
                        <h3 class="step-title" style="font-size: 1.8rem;">Đồng bộ hóa tức thì</h3>
                        <p class="hero-desc" style="font-size: 1rem;">Chỉ cần đăng nhập và kết nối. BeeAI tự động bóc tách độ ưu tiên và thời gian chết của bạn.</p>
                    </div>
                    <div class="step-image-wrapper">
                        <img src="/bee-step-1.png" alt="Step 1">
                    </div>
                </div>

                <div class="staircase-step reveal">
                    <div class="step-info">
                        <span class="step-number">02. PHÂN TÍCH</span>
                        <h3 class="step-title" style="font-size: 1.8rem;">Trí tuệ nhân tạo</h3>
                        <p class="hero-desc" style="font-size: 1rem;">Sử dụng thuật toán hiện đại để gợi ý một lịch trình làm việc tối ưu, không còn áp lực deadline.</p>
                    </div>
                    <div class="step-image-wrapper">
                        <img src="/bee-step-2.png" alt="Step 2">
                    </div>
                </div>

                <div class="staircase-step reveal">
                    <div class="step-info">
                        <span class="step-number">03. TẬN HƯỞNG</span>
                        <h3 class="step-title" style="font-size: 1.8rem;">Hiệu quả tối đa</h3>
                        <p class="hero-desc" style="font-size: 1rem;">Theo dõi tiến độ qua Dashboard trực quan. BeeAI điều chỉnh ngay lập tức khi lịch trình thay đổi.</p>
                    </div>
                    <div class="step-image-wrapper">
                        <img src="/bee-step-3.png" alt="Step 3">
                    </div>
                </div>
            </section>

            <!-- Simple Footer -->
            <footer style="padding: 60px 5% 40px; border-top: 1px solid var(--glass-border); text-align: center; color: var(--brand-text-muted); font-size: 0.85rem;">
                <img src="/logo.png" style="height: 32px; filter: grayscale(1); opacity: 0.5; margin-bottom: 20px;">
                <p>© 2026 PlanBee AI. Thiết kế tinh gọn bởi Trợ lý Bee. 🐝</p>
                <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px; opacity: 0.6; font-weight: 800;">
                    <a href="#" style="color: inherit; text-decoration: none;">Điều khoản</a>
                    <a href="#" style="color: inherit; text-decoration: none;">Bảo mật</a>
                    <a href="#" style="color: inherit; text-decoration: none;">Liên hệ</a>
                </div>
            </footer>
        </div>
    `;

    // ADD DYNAMIC EFFECTS
    const addEffects = () => {
        // Sticky Nav logic
        const nav = document.getElementById('landing-nav');
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) nav.classList.add('scrolled');
            else nav.classList.remove('scrolled');
        });

        // Intersection Observer for Reveal-on-Scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });

        container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    };

    setTimeout(addEffects, 50);

    // Logout logic
    const logoutBtn = document.getElementById('landing-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.hash = '#/login';
            window.location.reload(); 
        };
    }
};
