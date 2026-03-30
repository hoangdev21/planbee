import { state } from '../../main.js';

export const renderLanding = (container) => {
    // Inject CSS for landing page
    if (!document.getElementById('landing-styles')) {
        const link = document.createElement('link');
        link.id = 'landing-styles';
        link.rel = 'stylesheet';
        link.href = '/src/styles/landing.css';
        document.head.appendChild(link);
    }

    container.innerHTML = `
        <div class="landing-page">
            <!-- Navigation -->
            <nav class="landing-nav">
                <div class="nav-logo">
                    <img src="/logo.png" alt="PlanBee Logo" style="height: 56px; width: auto; object-fit: contain;">
                </div>
                <div class="nav-actions">
                    ${localStorage.getItem('token') && localStorage.getItem('token') !== 'null' && localStorage.getItem('token') !== 'undefined' ? `
                        <a href="#/dashboard" class="btn btn-primary-orange" style="padding: 12px 28px; border-radius: 12px; color: white; font-weight: 700;">Vào Dashboard</a>
                        <a href="#" id="landing-logout" class="nav-link" style="padding-top: 10px; margin-left: 15px; font-size: 0.9rem; opacity: 0.7;">Đăng xuất</a>
                    ` : `
                        <a href="#/login" class="nav-link" style="padding-top: 10px;">Đăng nhập</a>
                        <a href="#/register" class="btn btn-primary-orange" style="padding: 12px 28px; border-radius: 12px; color: white; font-weight: 700;">Dùng thử ngay</a>
                    `}
                </div>

            </nav>


            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-content">
                    <h1 class="hero-title">
                        Kiến tạo tương lai cùng <span>BeeAI</span>
                    </h1>
                    <p class="hero-desc">
                        Nâng tầm hiệu suất làm việc lên gấp 3 lần với hệ thống quản lý lịch trình thông minh nhất hiện nay. Trợ lý BeeAI sẽ thấu hiểu và sắp xếp mọi thứ cho bạn.
                    </p>
                    <div class="hero-btns">
                        <a href="#/register" class="btn btn-main btn-primary-orange">Bắt đầu miễn phí</a>
                        <a href="#demo" class="btn btn-main btn-secondary">
                            <i class="fas fa-play" style="font-size: 0.8rem; margin-right: 10px;"></i>
                            Khám phá thêm
                        </a>
                    </div>
                </div>
                <div class="hero-visual">
                    <div class="hero-img-container">
                        <img src="/hero-mockup.png" alt="PlanBee 3D Hero Mockup">
                    </div>
                </div>
            </section>

            <!-- How it works (Staircase Layout) -->
            <section id="how-it-works" style="padding: 140px 80px; background: var(--bg-color); position: relative; overflow: hidden;">
                <!-- Decorative background elements -->
                <div style="position: absolute; top: 10%; right: -5%; width: 400px; height: 400px; background: var(--primary-light); opacity: 0.5; border-radius: 50%; filter: blur(100px); z-index: 0;"></div>

                <div class="section-header" style="max-width: 850px; margin: 0 auto 120px; text-align: center; position: relative; z-index: 1;">
                    <div class="hero-badge" style="background: #FFF3E0; color: #FF9F1C;">QUY TRÌNH TỐI ƯU</div>
                    <h2 class="section-title" style="font-size: 3.5rem;">Cơ chế hoạt động kiểu <span>Bậc Thang</span></h2>
                    <p style="color: var(--text-muted); font-size: 1.2rem; max-width: 650px; margin: 0 auto;">Hình ảnh trực quan giúp bạn nắm bắt toàn bộ quy trình vận hành của BeeAI chỉ trong nháy mắt.</p>
                </div>

                <div class="staircase-container">
                    <!-- Step 1 -->
                    <div class="staircase-step">
                        <div class="step-info">
                            <span class="step-number-pill">BƯỚC 01</span>
                            <h3 class="step-title">Khởi động & Thiết lập</h3>
                            <p class="step-description">
                                Chỉ cần đăng nhập và kết nối các nền tảng công việc của bạn. Hệ thống sẽ tự động đồng bộ hóa mọi dữ liệu đầu vào để chuẩn bị cho bước phân tích chuyên sâu.
                            </p>
                        </div>
                        <div class="step-image-box">
                            <img src="/bee-step-1.png" alt="Setup Step">
                        </div>
                    </div>

                    <!-- Step 2 -->
                    <div class="staircase-step">
                        <div class="step-info">
                            <span class="step-number-pill" style="background: #2D3436;">BƯỚC 02</span>
                            <h3 class="step-title">BeeAI Phân tích</h3>
                            <p class="step-description">
                                Sử dụng thuật toán Random Forest và xử lý ngôn ngữ tự nhiên, BeeAI bóc tách độ ưu tiên, thời gian chết và gợi ý cho bạn một lịch trình làm việc không thể hoàn hảo hơn.
                            </p>
                        </div>
                        <div class="step-image-box">
                            <img src="/bee-step-2.png" alt="AI Analysis Step">
                        </div>
                    </div>

                    <!-- Step 3 -->
                    <div class="staircase-step">
                        <div class="step-info">
                            <span class="step-number-pill">BƯỚC 03</span>
                            <h3 class="step-title">Tối ưu & Hoàn tất</h3>
                            <p class="step-description">
                                Theo dõi tiến độ thông qua bảng Dashboard trực quan. Mọi sự thay đổi bất ngờ trong ngày đều được BeeAI điều chỉnh ngay lập tức để đảm bảo bạn không bao giờ lỡ deadline.
                            </p>
                        </div>
                        <div class="step-image-box">
                            <img src="/bee-step-3.png" alt="Final Step">
                        </div>
                    </div>
                </div>
            </section>


            <!-- AI Demo Showcase -->
            <section id="demo" class="ai-demo-section">
                <div class="hero-visual">
                    <div class="ai-chat-mock">
                        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 16px;">
                            <div style="width: 44px; height: 44px; background: #FFF3E0; border-radius: 50%; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 2px solid var(--brand-orange);">
                                <img src="/bee.png" alt="BeeAI Avatar" style="width: 32px; height: 32px; object-fit: contain;">
                            </div>
                            <div style="display: flex; flex-direction: column;">
                                <span style="font-weight: 800; font-size: 1.1rem; color: var(--text-main);">Trợ lý BeeAI</span>
                                <span style="font-size: 0.75rem; color: #00B894; font-weight: 700;">
                                    <i class="fas fa-circle" style="font-size: 0.5rem; margin-right: 4px;"></i> ĐANG TRỰC TUYẾN
                                </span>
                            </div>
                        </div>
                        <div class="chat-bubble bubble-ai">Xin chào! Dựa trên deadline hôm nay, tôi đề xuất ưu tiên dự án CRM trước 10h sáng. Bạn muốn tôi xếp lịch ngay chứ?</div>
                        <div class="chat-bubble bubble-user">Chính xác, hãy lên lịch cho tôi nhé!</div>
                        <div class="chat-bubble bubble-ai" style="animation-duration: 0.4s; animation-delay: 1.2s; background: #FFF9C4;">Đã xong! Lịch trình của bạn đã được cập nhật mượt mà. Đã dành ra 2 tiếng tập trung cao độ. 🐝✨</div>
                    </div>

                </div>
                <div class="hero-content">
                    <div class="hero-badge" style="background: #E3F2FD; color: #1976D2;">THÔNG MINH HƠN</div>
                    <h2 class="section-title">Giao tiếp như <span>người thật</span></h2>
                    <p class="hero-desc">
                        Không còn những câu lệnh khô khan. BeeAI gợi ý dựa trên ngữ cảnh thực tế, giúp bạn giảm bớt gánh nặng quyết định mỗi ngày.
                    </p>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="padding: 20px; background: white; border-radius: 16px; border: 1px solid var(--border-color);">
                            <i class="fas fa-brain" style="color: var(--brand-orange); margin-bottom: 12px; font-size: 1.5rem;"></i>
                            <h4 style="margin-bottom: 8px;">Hiểu ý bạn</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">Tự động phát hiện ưu tiên thông qua thói quen.</p>
                        </div>
                        <div style="padding: 20px; background: white; border-radius: 16px; border: 1px solid var(--border-color);">
                            <i class="fas fa-bolt" style="color: var(--brand-orange); margin-bottom: 12px; font-size: 1.5rem;"></i>
                            <h4 style="margin-bottom: 8px;">Tốc độ cao</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted);">Xử lý và cập nhật lịch trình chỉ trong 1 giây.</p>
                        </div>
                    </div>
                </div>
            </section>



            <!-- Modern Footer -->
            <footer class="footer-main">
                <div class="footer-grid">
                    <div class="footer-brand-col">
                        <img src="/logo.png" alt="PlanBee Logo">
                        <p class="footer-brand-desc">
                            PlanBee là trợ lý AI thông minh giúp bạn tối ưu hóa thời gian, quản lý công việc và kiến tạo lối sống khoa học hơn mỗi ngày.
                        </p>
                        <div class="social-links">
                            <a href="#" class="social-icon"><i class="fab fa-facebook-f"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-twitter"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-linkedin-in"></i></a>
                            <a href="#" class="social-icon"><i class="fab fa-instagram"></i></a>
                        </div>
                    </div>

                    <div>
                        <h4 class="footer-col-title">Sản phẩm</h4>
                        <ul class="footer-links">
                            <li><a href="#features" class="footer-link">Tính năng</a></li>
                            <li><a href="#how-it-works" class="footer-link">Quy trình</a></li>
                            <li><a href="#demo" class="footer-link">BeeAI Trợ lý</a></li>
                            <li><a href="#/register" class="footer-link">Đăng ký dùng thử</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="footer-col-title">Công ty</h4>
                        <ul class="footer-links">
                            <li><a href="#" class="footer-link">Về chúng tôi</a></li>
                            <li><a href="#" class="footer-link">Tuyển dụng</a></li>
                            <li><a href="#" class="footer-link">Blog công nghệ</a></li>
                            <li><a href="#" class="footer-link">Liên hệ</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 class="footer-col-title">Hỗ trợ</h4>
                        <ul class="footer-links">
                            <li><a href="#" class="footer-link">Trung tâm trợ giúp</a></li>
                            <li><a href="#" class="footer-link">Hướng dẫn sử dụng</a></li>
                            <li><a href="#" class="footer-link">API Tài liệu</a></li>
                            <li><a href="#" class="footer-link">Yêu cầu tính năng</a></li>
                        </ul>
                    </div>
                </div>

                <div class="footer-bottom">
                    <p>© 2026 PlanBee AI. All rights reserved.</p>
                    <div class="footer-legal-links">
                        <a href="#" class="footer-legal-link">Điều khoản</a>
                        <a href="#" class="footer-legal-link">Bảo mật</a>
                        <a href="#" class="footer-legal-link">Cookies</a>
                    </div>
                </div>
            </footer>

        </div>
    `;

    // Logout logic inside landing
    const logoutBtn = document.getElementById('landing-logout');
    if (logoutBtn) {
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.reload(); 
        };
    }
};


