import '../styles/landing.css';

export const renderLanding = (container) => {
    container.innerHTML = `
        <div class="landing-page">
            <!-- Companion Flying Bee -->
            <div id="companion-bee" class="companion-bee idle" style="top: 20%; transform: translateY(-50%);">
                <div class="bee-popover" id="bee-msg">Chào bạn! Mình là BeeAI 🐝</div>
                <div class="bee-wrapper" style="width: 100%; height: 100%;">
                    <svg class="bee-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                        <!-- Left Wing -->
                        <path class="bee-wing left" d="M40 40 C 20 10, 0 30, 30 50 Z" />
                        <!-- Right Wing -->
                        <path class="bee-wing right" d="M60 40 C 80 10, 100 30, 70 50 Z" />
                        <!-- Body -->
                        <ellipse class="bee-body" cx="50" cy="55" rx="20" ry="32" />
                        <!-- Stripes -->
                        <path class="bee-stripe" d="M31 52 Q 50 62 69 52 L 69 60 Q 50 70 31 60 Z" />
                        <path class="bee-stripe" d="M35 72 Q 50 82 65 72 L 61 80 Q 50 88 39 80 Z" />
                        <!-- Head -->
                        <circle class="bee-stripe" cx="50" cy="24" r="14" />
                        <!-- Eyes -->
                        <circle fill="#fff" cx="44" cy="22" r="3" />
                        <circle fill="#fff" cx="56" cy="22" r="3" />
                        <!-- Smile -->
                        <path stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none" d="M46 30 Q 50 34 54 30" />
                        <!-- Antennae -->
                        <path stroke="currentColor" class="bee-stripe" stroke-width="2" stroke-linecap="round" fill="none" d="M42 16 Q 35 5 30 10" />
                        <path stroke="currentColor" class="bee-stripe" stroke-width="2" stroke-linecap="round" fill="none" d="M58 16 Q 65 5 70 10" />
                        <!-- Stinger -->
                        <polygon class="bee-stripe" points="46,82 54,82 50,98" />
                    </svg>
                </div>
            </div>

            <!-- Background Effects -->
            <div class="bg-grid"></div>
            <div class="blob top-blob"></div>
            <div class="blob bottom-blob"></div>

            <!-- Pre-Header Spacing -->
            <div style="height: 40px;"></div>

            <!-- Modern Navigation -->
            <nav id="landing-nav" class="landing-nav">
                <div class="nav-logo" style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                    <img src="/logo.png" alt="PlanBee Logo" style="height: 40px; width: auto; object-fit: contain;">
                    <span style="font-weight: 900; letter-spacing: -1px; font-size: 1.25rem;">PlanBee</span>
                </div>
                <div class="nav-actions">
                    ${localStorage.getItem('token') && localStorage.getItem('token') !== 'null' ? `
                        <a href="#/dashboard" class="btn-premium btn-primary-orange" style="padding: 10px 20px; font-size: 0.85rem;">Dashboard</a>
                        <a href="#" id="landing-logout" style="color: var(--text-muted); font-size: 0.85rem; font-weight: 700; text-decoration: none; transition: color 0.2s;">Đăng xuất</a>
                    ` : `
                        <a href="#/login" style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700; text-decoration: none;">Đăng nhập</a>
                        <a href="#/register" class="btn-premium btn-primary-orange" style="padding: 10px 20px; font-size: 0.85rem;">Dùng thử ngay</a>
                    `}
                </div>
            </nav>

            <!-- Ultimate Hero Section -->
            <section class="hero-section">
                <div class="hero-content reveal">
                    <h1 class="hero-title">
                        Làm Việc Ít Hơn,<br><span>Hoàn Thành Nhiều Hơn</span>
                    </h1>
                    <p class="hero-desc">
                        Trải nghiệm sức mạnh của AI trong việc tự động hóa lịch trình, quản lý công việc và tối ưu hóa thời gian của bạn chỉ với một tin nhắn.
                    </p>
                    <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                        <a href="#/register" class="btn-premium btn-primary-orange">Bắt đầu miễn phí <i class="fas fa-arrow-right"></i></a>
                        <a href="#features" class="btn-premium btn-secondary-white">Khám phá tính năng</a>
                    </div>
                </div>
                <div class="hero-visual reveal shadow-xl" style="position: relative; flex: 1.5;">
                     <!-- Increased Width and Removed Tilt for Clarity -->
                    <div class="mockup-window" style="max-width: 680px; margin-left: auto; transform: none; border: none; box-shadow: 0 30px 80px rgba(0,0,0,0.15);">
                        <img src="/hero-mockup.png" alt="PlanBee Dash" style="width: 100%; display: block; border-radius: 20px;">
                    </div>
                </div>
            </section>

            <!-- Features Section -->
            <section id="features" class="features-section">
                
                <!-- Feature 1: Video Chat -->
                <div class="feature-block reveal">
                    <div class="feature-info">
                        <span class="feature-tag">Tương Tác Trực Tiếp</span>
                        <h2 class="feature-title">Trò chuyện cùng<br>Trợ Lý BeeAI</h2>
                        <p class="feature-desc">Không cần thao tác phức tạp, chỉ cần nói cho BeeAI biết bạn muốn làm gì. Hệ thống sẽ tự động lên lịch, thêm deadline và nhắc nhở bạn đúng hẹn.</p>
                        <ul style="list-style: none; padding: 0; color: var(--text-muted); font-weight: 500; display: flex; flex-direction: column; gap: 12px;">
                            <li><i class="fas fa-check-circle" style="color: var(--brand-orange); margin-right: 8px;"></i> Nhận diện ngôn ngữ tự nhiên</li>
                            <li><i class="fas fa-check-circle" style="color: var(--brand-orange); margin-right: 8px;"></i> Tự động xếp lịch thông minh</li>
                            <li><i class="fas fa-check-circle" style="color: var(--brand-orange); margin-right: 8px;"></i> Cập nhật trạng thái tức thì</li>
                        </ul>
                    </div>
                    
                    <div class="mockup-container widget-visual-container">
                        <div class="widget-glow-sphere"></div>
                        <div class="widget-mockup-wrapper">
                            <img src="/chat-bee-widget.png" alt="BeeAI Chat Widget" class="widget-image">
                        </div>
                    </div>
                </div>


                <!-- Feature 3: Telegram Notifications (Redesigned Pro Max) -->
                <div class="feature-block reveal telegram-pro-section">
                    <div class="feature-info">
                        <span class="feature-tag">Độc Quyền Tại PlanBee</span>
                        <h2 class="feature-title">Thông báo tức thời<br><span>qua Telegram Bot</span></h2>
                        <p class="feature-desc">Không bao giờ bỏ lỡ cuộc họp hay deadline quan trọng. PlanBee đồng bộ hóa trực tiếp với Telegram để gửi lời nhắc cá nhân hóa, báo cáo ngày và cho phép bạn điều khiển lịch trình chỉ bằng giọng nói.</p>
                        
                        <div class="pro-features-list">
                            <div class="pro-feature-item">
                                <div class="pro-icon"><i class="fas fa-bolt"></i></div>
                                <div>
                                    <h4>Tốc độ vượt trội</h4>
                                    <p>Nhận thông báo reminder chỉ trong 0.5 giây.</p>
                                </div>
                            </div>
                            <div class="pro-feature-item">
                                <div class="pro-icon"><i class="fas fa-fingerprint"></i></div>
                                <div>
                                    <h4>Bảo mật tuyệt đối</h4>
                                    <p>Mã hóa dữ liệu đầu cuối, an toàn 100%.</p>
                                </div>
                            </div>
                        </div>

                        <div style="margin-top: 32px; display: flex; align-items: center; gap: 12px;">
                            <a href="https://t.me/beeai21_bot" target="_blank" class="btn-premium btn-primary-orange" style="padding: 12px 24px; font-size: 0.9rem;">
                                Kết nối ngay <i class="fab fa-telegram-plane"></i>
                            </a>
                            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">@PlanBeeAIBot</span>
                        </div>
                    </div>
                    
                    <div class="mockup-container tele-visual-container">
                        <div class="glow-sphere"></div>
                        <div class="tele-mockup-stack">
                            <!-- Background Phone (Chat) -->
                            <div class="tele-phone phone-back">
                                <div class="phone-solid-bg">
                                    <img src="/chat-bee-tele.png" alt="Telegram Chat Mockup">
                                </div>
                            </div>
                            <!-- Foreground Phone (QR/Profile) -->
                            <div class="tele-phone phone-front">
                                <div class="phone-solid-bg">
                                    <img src="/qr-bee-tele.png" alt="Telegram QR Mockup">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>

            <!-- Magic Meadow Section -->
            <section class="magic-meadow">
                <!-- Layers of Depth -->
                <div class="meadow-ground-layer meadow-ground-back"></div>
                <!-- Dynamic Canvas for Leaves & Bees -->
                <div id="meadow-canvas"></div>
                <!-- Interactive Grass & Flowers -->
                <div class="meadow-ground-layer meadow-ground-front"></div>
            </section>

            <!-- Ultimate Footer -->
            <footer class="landing-footer">
                <img src="/logo.png" style="height: 48px; filter: grayscale(1); opacity: 0.6; margin-bottom: 24px;">
                <p style="font-size: 0.9rem; font-weight: 500; color: var(--text-muted); text-align: center;">© 2026 PlanBee AI. Nền tảng quản lý thời gian cao cấp.</p>
                <div style="display: flex; justify-content: center; gap: 32px; margin-top: 24px; opacity: 0.8; font-weight: 700; font-size: 0.85rem;">
                    <a href="#" style="color: inherit; text-decoration: none; transition: color 0.2s;">Giới thiệu</a>
                    <a href="#" style="color: inherit; text-decoration: none; transition: color 0.2s;">Bảo mật</a>
                    <a href="#" style="color: inherit; text-decoration: none; transition: color 0.2s;">Điều khoản</a>
                    <a href="#" style="color: inherit; text-decoration: none; transition: color 0.2s;">Liên hệ</a>
                </div>
            </footer>
        </div>
    `;

    // Dynamic Effects Logic
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
        }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

        container.querySelectorAll('.reveal').forEach((el, index) => {
            // Stagger delay based on node order if needed
            el.style.transitionDelay = `${index * 0.05}s`;
            observer.observe(el);
        });

        // Companion Bee Interactive Logic (Artistic Flight + Trail logic)
        const bee = document.getElementById('companion-bee');
        const beeWrapper = bee.querySelector('.bee-wrapper');
        const beeSvg = bee.querySelector('.bee-svg');
        const beeMsg = document.getElementById('bee-msg');
        
        let currentX = window.innerWidth * 0.85; 
        let currentY = window.innerHeight * 0.2; 
        let targetX = currentX;
        let targetY = currentY;
        
        let isScrolling = false;
        let scrollTimeout;
        let time = 0;
        let lastSpawn = 0;
        
        let idleTargetX = currentX;
        let idleTargetY = currentY;

        const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

        // Contextual Tour Guide Messages
        const forceSpeak = (text) => {
            beeMsg.innerText = text;
            beeMsg.classList.add('active'); 
            
            clearTimeout(window.beeMsgTimeout);
            window.beeMsgTimeout = setTimeout(() => {
                beeMsg.classList.remove('active');
            }, 6000); // Hide after 6s
        };

        const guideSteps = [
            { id: 'hero', msg: "Chào mừng bạn tới với PlanBee, tận hưởng ngay nhé 💛", align: 0.8 }, // Right side
            { id: 'video', msg: "Chat với tớ qua widget này nhé!", align: 0.15 }, // Left side (Video Section)
            { id: 'telegram', msg: "Nhận thông báo lịch trình qua Telegram liền tay!", align: 0.8 } // Right side (Telegram Section)
        ];

        let currentGuideIndex = -1;
        const sectionsToObserve = [
            container.querySelector('.hero-section'),
            ...container.querySelectorAll('.feature-block')
        ];

        // Refined Observer: Uses rootMargin to target the "active" zone of the screen
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const index = sectionsToObserve.indexOf(entry.target);
                    if (index !== -1 && index !== currentGuideIndex) {
                        currentGuideIndex = index;
                        const step = guideSteps[index];
                        if (step) {
                            forceSpeak(step.msg);
                            // Smoothly move bee to its preferred side for this section
                            idleTargetX = window.innerWidth * step.align; 
                            idleTargetY = window.innerHeight * 0.4; 
                        }
                    }
                }
            });
        }, { 
            root: null,
            rootMargin: '-25% 0px -45% 0px', // Narrow detection band in upper-middle screen
            threshold: 0.1 
        });
        
        sectionsToObserve.forEach(s => { if(s) sectionObserver.observe(s); });

        // Force Initial Hero Message!
        setTimeout(() => {
            if (currentGuideIndex === -1 && guideSteps[0]) {
                currentGuideIndex = 0;
                forceSpeak(guideSteps[0].msg);
                idleTargetX = window.innerWidth * guideSteps[0].align;
                idleTargetY = window.innerHeight * 0.4;
            }
        }, 800); // Wait for initial render and bee animation to settle

        // Anti-Flicker Tele Mockup Swap Logic 
        const teleStack = container.querySelector('.tele-mockup-stack');
        if (teleStack) {
            const phoneBack = teleStack.querySelector('.phone-back');
            const phoneFront = teleStack.querySelector('.phone-front');
            
            phoneBack.addEventListener('mouseenter', () => {
                teleStack.classList.add('swap-back');
                teleStack.classList.remove('focus-front');
            });
            
            phoneFront.addEventListener('mouseenter', () => {
                if (!teleStack.classList.contains('swap-back')) {
                    teleStack.classList.add('focus-front');
                }
            });

            teleStack.addEventListener('mouseleave', () => {
                teleStack.classList.remove('swap-back', 'focus-front');
            });
        }

        const spawnTrail = (x, y, dx, dy) => {
            const now = performance.now();
            if (now - lastSpawn < 50) return; // Faster spawn rate (50ms instead of 80ms)
            lastSpawn = now;

            const p = document.createElement('div');
            p.className = 'bee-trail-particle';
            
            // Mix of magical and floral shapes
            const shapes = ['🌸', '✨', '🌼', '💫', '🌞', '✨', '🌸'];
            p.innerText = shapes[Math.floor(Math.random() * shapes.length)];
            
            // Randomize spawn offset slightly for a "puff" effect
            p.style.left = (x + (Math.random()-0.5)*20) + 'px';
            p.style.top = (y + (Math.random()-0.5)*20) + 'px';
            
            // Dynamic drift based on motion but with some randomness
            const force = 1.8;
            p.style.setProperty('--dx', ((-dx * force) + (Math.random()-0.5)*50) + 'px');
            p.style.setProperty('--dy', ((-dy * force) + 15 + (Math.random()-0.5)*50) + 'px');
            p.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
            p.style.setProperty('--sz', (0.8 + Math.random() * 1.2)); // Random scale multiplier

            // Vibrant golden and pink tones
            const hue = Math.random() > 0.5 ? 45 : 330; // Gold or Pinkish
            p.style.color = `hsl(${hue}, 100%, 75%)`;
            p.style.textShadow = `0 0 15px hsl(${hue}, 100%, 60%), 0 0 5px white`;

            document.body.appendChild(p);
            setTimeout(() => p.remove(), 1200); 
        };

        const updateBee = () => {
            time += 0.012; // Adjusted time factor

            // Final smoothed target with ambient hovering
            const finalTargetX = idleTargetX + Math.sin(time) * 20; 
            const finalTargetY = idleTargetY + Math.sin(time * 1.5) * 20;

            const prevX = currentX;
            const prevY = currentY;

            // Stable easing across sections
            const easing = 0.025; 
            currentX = lerp(currentX, finalTargetX, easing);
            currentY = lerp(currentY, finalTargetY, easing);

            bee.style.left = currentX + 'px';
            bee.style.top = currentY + 'px';

            const dx = currentX - prevX;
            const dy = currentY - prevY;
            const speed = Math.sqrt(dx*dx + dy*dy);

            if (speed > 0.15) {
                if (dx < -0.15) beeWrapper.style.transform = 'scaleX(-1)';
                else if (dx > 0.15) beeWrapper.style.transform = 'scaleX(1)';

                let rot = (dy * 1.8); 
                rot = Math.max(-25, Math.min(25, rot)); 
                beeSvg.style.transform = `rotate(${rot}deg)`;
                
                if (speed > 1.2) {
                    spawnTrail(currentX, currentY, dx, dy);
                }
            } else {
                beeSvg.style.transform = `rotate(0deg)`;
            }
            
            requestAnimationFrame(updateBee);
        };
        updateBee();

        // Rải hiệu ứng cực đẹp khi đang rảnh rỗi chờ user cuộn tiếp
        setInterval(() => {
            if (!isScrolling) {
                // Burst of majestic magic
                for(let i=0; i<6; i++) {
                     const sp = document.createElement('div');
                     sp.className = 'bee-sparkle';
                     sp.style.left = '50%';
                     sp.style.top = '50%';
                     const angle = Math.random() * Math.PI * 2;
                     const dist = 30 + Math.random() * 40;
                     sp.style.setProperty('--dx', Math.cos(angle)*dist + 'px');
                     sp.style.setProperty('--dy', Math.sin(angle)*dist + 'px');
                     sp.style.animation = 'sparklePop 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards';
                     bee.appendChild(sp);
                     setTimeout(() => sp.remove(), 1200);
                 }
            }
        }, 2500);

        window.addEventListener('scroll', () => {
            if (!isScrolling) {
                isScrolling = true;
                bee.classList.remove('idle');
                bee.classList.add('flying');
            }
            
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                bee.classList.remove('flying');
                bee.classList.add('idle');
            }, 100);
        });

        // --- MAGIC MEADOW LOGIC ---
        const meadowBg = container.querySelector('.magic-meadow');
        const meadowCanvas = container.querySelector('#meadow-canvas');
        if (meadowCanvas && meadowBg) {
            
            // 1. Plant Lush Flora (Grass and Flowers)
            const floraCount = Math.floor(window.innerWidth / 8); // Extremely dense!
            const flowerShapes = ['🌸', '🌼', '🌻', '🌷', '🏵️'];
            for(let i=0; i<floraCount; i++) {
                const isFlower = Math.random() > 0.85; // 15% flowers, 85% grass
                const flora = document.createElement('div');
                
                const leftPos = (Math.random() * 105 - 2.5) + '%';
                
                // Real 3D layering: Back, Mid, Front
                const depthRoll = Math.random();
                let zIdx = 3; let bottomBase = 50; let bottomRange = 30; let scale = 0.6;
                
                if (depthRoll > 0.7) { 
                    zIdx = 12; // Front of the hill
                    bottomBase = -10; bottomRange = 20; scale = 1.2;
                } else if (depthRoll > 0.3) { 
                    zIdx = 8; // Midground
                    bottomBase = 20; bottomRange = 30; scale = 0.9;
                }

                const bottomPos = (Math.random() * bottomRange + bottomBase) + 'px';
                const duration = (Math.random() * 2 + 2) + 's';
                flora.style.zIndex = zIdx;
                
                if (isFlower) {
                    flora.className = 'meadow-flower';
                    flora.style.setProperty('--flower-left', leftPos);
                    flora.style.setProperty('--flower-bottom', bottomPos);
                    flora.style.setProperty('--sway-duration', duration);
                    flora.style.setProperty('--fl-scale', scale);
                    flora.innerHTML = `<div class="flower-head">${flowerShapes[Math.floor(Math.random() * flowerShapes.length)]}</div>`;
                } else {
                    flora.className = 'meadow-grass';
                    flora.style.setProperty('--grass-left', leftPos);
                    flora.style.setProperty('--grass-bottom', bottomPos);
                    flora.style.setProperty('--sway-duration', duration);
                    flora.style.setProperty('--fl-scale', scale);
                    flora.style.setProperty('--grass-h', (Math.random() * 70 + 40) + 'px');
                    flora.style.setProperty('--grass-tilt', (Math.random() * 30 - 15) + 'deg');
                    if (Math.random() > 0.5) flora.classList.add('dark-blade');
                }
                
                meadowBg.appendChild(flora);
            }

            // 2. Spawn Falling Leaves
            const spawnLeaf = () => {
                const leaf = document.createElement('div');
                leaf.className = 'meadow-leaf';
                leaf.style.left = Math.random() * 100 + '%';
                leaf.style.animationDuration = (Math.random() * 5 + 6) + 's';
                leaf.style.setProperty('--sz', Math.random() * 0.5 + 0.5);
                leaf.style.setProperty('--op', Math.random() * 0.4 + 0.2);
                
                const colors = ['#fcd34d', '#fbbf24', '#f59e0b', '#bbf7d0', '#86efac'];
                leaf.style.background = colors[Math.floor(Math.random() * colors.length)];
                
                meadowCanvas.appendChild(leaf);
                setTimeout(() => { if(leaf.parentNode) leaf.parentNode.removeChild(leaf); }, 11000);
            };

            // 3. Spawn Worker Bees looking for nectar
            const spawnMeadowBee = () => {
                const wrap = document.createElement('div');
                wrap.className = 'meadow-bee-wrap';
                
                const beeImg = document.createElement('img');
                beeImg.src = '/bee.png';
                beeImg.className = 'meadow-bee-img';
                wrap.appendChild(beeImg);
                
                // Random height and trajectory
                wrap.style.top = (Math.random() * 50 + 10) + '%';
                const duration = Math.random() * 10 + 12; // Very smooth, long flight
                wrap.style.animationDuration = duration + 's';
                
                // Random depth size
                const zScale = Math.random() * 0.4 + 0.4;
                beeImg.style.width = (60 * zScale) + 'px';
                
                // Fly direction logic
                const flyLeft = Math.random() > 0.5;
                if (flyLeft) {
                    wrap.style.animationName = 'meadowFlyLeft';
                } else {
                    wrap.style.animationName = 'meadowFlyRight';
                }
                
                meadowCanvas.appendChild(wrap);
                setTimeout(() => { if(wrap.parentNode) wrap.parentNode.removeChild(wrap); }, duration * 1000 + 1000);
            };

            // Seed initial ecosystem
            for(let i=0; i<5; i++) setTimeout(spawnLeaf, Math.random() * 2000);
            for(let i=0; i<3; i++) setTimeout(spawnMeadowBee, Math.random() * 3000);
            
            // Let nature run
            setInterval(spawnLeaf, 1500);
            setInterval(spawnMeadowBee, 4000);
        }
    };

    setTimeout(addEffects, 100);

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
