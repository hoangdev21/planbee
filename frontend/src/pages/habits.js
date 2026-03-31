import api from '../utils/api.js';

let allHabits = [];
let currentFilters = { search: '', status: 'all', frequency: 'all' };

export const renderHabits = async (container) => {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);"><div class="loading-spinner"></div> Đang tải kỷ luật...</div>`;

    try {
        const response = await api.get('/habits/all');
        allHabits = response.habits;
        updateHabitsUI(container);
    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Lỗi hệ thống: ${error.message}</div>`;
    }
};

const updateHabitsUI = (container) => {
    const today = new Date().toISOString().slice(0, 10);
    const filtered = allHabits.filter(h => {
        const matchesSearch = h.title.toLowerCase().includes(currentFilters.search.toLowerCase());
        const isDone = h.last_completed && h.last_completed.startsWith(today);
        const matchesStatus = currentFilters.status === 'all' || (currentFilters.status === 'done' ? isDone : !isDone);
        return matchesSearch && matchesStatus;
    });

    const completedCount = allHabits.filter(h => h.last_completed && h.last_completed.startsWith(today)).length;
    const progressPercent = allHabits.length > 0 ? Math.round((completedCount / allHabits.length) * 100) : 0;

    container.innerHTML = `
        <div class="habits-premium-container fade-in">
            <!-- Elite Dashboard Header -->
            <div class="habits-elite-dashboard">
                <div class="dashboard-top-info">
                    <div class="title-group">
                        <h2 class="elite-title">Kỷ luật tự thân</h2>
                        <p class="elite-subtitle">Chinh phục 1% mỗi ngày cùng PlanBee.</p>
                    </div>
                </div>

                <div class="stats-master-card">
                    <div class="stats-main-flow">
                        <div class="stat-unit">
                            <div class="stat-icon-bg"><i class="fas fa-check-circle"></i></div>
                            <div class="stat-content">
                                <span class="val">${completedCount}<span>/${allHabits.length}</span></span>
                                <span class="lbl">HÔM NAY</span>
                            </div>
                        </div>
                        <div class="stat-divider"></div>
                        <div class="stat-unit progress-unit">
                            <div class="progress-ring-container">
                                <svg class="ring-svg" viewBox="0 0 40 40">
                                    <circle class="ring-bg" cx="20" cy="20" r="18" fill="none" stroke="var(--border-color)" stroke-width="3"></circle>
                                    <circle class="ring-fg" cx="20" cy="20" r="18" fill="none" stroke="var(--primary-color)" stroke-width="3" stroke-linecap="round" style="stroke-dasharray: 113; stroke-dashoffset: ${113 - (113 * progressPercent) / 100}"></circle>
                                </svg>
                                <span class="ring-percent">${progressPercent}%</span>
                            </div>
                        </div>
                    </div>
                    <button id="show-habit-modal" class="btn-create-master">
                        <i class="fas fa-plus-circle"></i> THIẾT LẬP
                    </button>
                </div>
            </div>

            <!-- Navigator Bar (Tabs & Search) -->
            <div class="habit-navigator-bar">
                <div class="pills-container">
                    ${['all', 'incomplete', 'done'].map(st => {
                        const labels = { all: 'Tất cả', incomplete: 'Đang tập', done: 'Đạt mục tiêu' };
                        return `
                            <button class="pill-btn ${currentFilters.status === st ? 'active' : ''}" data-status="${st}">
                                ${labels[st]}
                            </button>
                        `;
                    }).join('')}
                </div>
                <div class="search-master-wrap">
                    <i class="fas fa-search"></i>
                    <input type="text" id="habit-search" placeholder="Tìm kỷ luật..." value="${currentFilters.search}">
                </div>
            </div>

            <!-- Habits Grid -->
            ${filtered.length > 0 ? `
                <div class="habits-grid-premium">
                    ${filtered.map(habit => {
                        const isDone = habit.last_completed && habit.last_completed.startsWith(today);
                        const streak = habit.current_streak || 0;
                        
                        return `
                            <div class="habit-card-elite ${isDone ? 'is-completed' : ''}">
                                ${streak > 0 ? `<div class="streak-tag"><i class="fas fa-fire"></i> ${streak}</div>` : ''}
                                <div class="card-inner">
                                    <div class="card-top">
                                        <div class="habit-icon-wrap">
                                            <div class="icon-sphere">
                                                <img src="${isDone ? '/complete.png' : (habit.frequency === 'daily' ? '/lightning.png' : '/thunder.png')}" alt="icon">
                                            </div>
                                        </div>
                                        <div class="habit-main-data">
                                            <h4 class="habit-title">${habit.title}</h4>
                                            <div class="habit-badges">
                                                <span class="badge freq-badge">${habit.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}</span>
                                                <span class="badge time-badge"><i class="far fa-clock"></i> ${habit.preferred_time ? habit.preferred_time.slice(0, 5) : 'Bất kỳ'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="habit-desc-minimal">
                                        ${habit.description || 'Duy trì kỷ luật nhỏ mỗi ngày sẽ tạo nên sự thay đổi vĩ đại.'}
                                    </div>

                                    <div class="habit-progress-viz">
                                        <div class="viz-dots">
                                            ${Array(7).fill(0).map((_, i) => `<div class="viz-dot ${i < (streak % 7 || (isDone ? 7 : 0)) ? 'active' : ''}"></div>`).join('')}
                                        </div>
                                        <div class="viz-label">${isDone ? 'Đạt' : 'Đang tập'}</div>
                                    </div>

                                    <div class="habit-card-footer">
                                        ${!isDone ? `
                                            <button class="btn-action-checkin checkin-btn" data-id="${habit.id}">
                                                <i class="fas fa-check-double"></i> ĐIỂM DANH
                                            </button>
                                            <button class="btn-action-delete delete-btn" data-id="${habit.id}">
                                                <i class="far fa-trash-alt"></i>
                                            </button>
                                        ` : `
                                            <div class="done-ribbon">
                                                <i class="fas fa-award"></i> THÀNH CÔNG
                                            </div>
                                            <button class="btn-action-delete delete-btn" data-id="${habit.id}">
                                                <i class="far fa-trash-alt"></i>
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="empty-state-illust">
                    <div class="bee-hover-container">
                        <img class="flying-bee" src="/bee.png" alt="Bee Mascot">
                        <div class="bee-shadow"></div>
                    </div>
                    <h3 style="font-size: 1.5rem; font-weight: 900; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.5px;">Chưa Có Thói Quen Nào</h3>
                    <p class="empty-text">Chú ong PlanBee đang chờ bạn đó! Hãy bắt đầu thiết lập kỷ luật và chinh phục 1% mỗi ngày ngay hôm nay.</p>
                    <button class="btn-create-master empty-create-btn" onclick="document.getElementById('show-habit-modal').click()">
                        <i class="fas fa-plus-circle"></i> THIẾT LẬP KỶ LUẬT
                    </button>
                </div>
            `}

            <!-- Designer Modal -->
            <div id="habit-modal" class="modal-overlay" style="display: none;">
                <div class="modal-elite-designer">
                    <div class="modal-header-banner">
                        <div class="banner-icon"><i class="fas fa-magic"></i></div>
                        <div class="banner-text">
                            <h3>Thiết lập Kỷ luật</h3>
                            <p>Thay đổi hành vi, kiến tạo tương lai.</p>
                        </div>
                        <button id="close-modal-x" class="modal-x-btn"><i class="fas fa-times"></i></button>
                    </div>

                    <form id="habit-form" class="elite-form">
                        <div class="field-group">
                            <label><i class="fas fa-signature"></i> Tên thói quen</label>
                            <input type="text" name="title" placeholder="Ví dụ: Đọc sách, Chạy bộ..." required>
                        </div>
                        <div class="field-group">
                            <label><i class="fas fa-quote-left"></i> Ghi chú & Động lực</label>
                            <textarea name="description" placeholder="Tại sao bạn làm điều này?" rows="2"></textarea>
                        </div>
                        <div class="field-row">
                            <div class="field-group">
                                <label><i class="far fa-clock"></i> Thời gian</label>
                                <input type="time" name="preferred_time">
                            </div>
                            <div class="field-group">
                                <label><i class="fas fa-calendar-check"></i> Tần suất</label>
                                <select name="frequency">
                                    <option value="daily">Hàng ngày</option>
                                    <option value="weekly">Hàng tuần</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer-actions">
                            <button type="button" id="close-h-modal" class="btn-cancel-elite">Hủy bỏ</button>
                            <button type="submit" class="btn-submit-elite">KÍCH HOẠT</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <style>
            .habits-premium-container { padding: 0; box-sizing: border-box; min-height: 100vh; width: 100%; margin: 0; }
            
            /* Elite Dashboard Header */
            .habits-elite-dashboard { margin-bottom: 32px; display: flex; flex-direction: column; gap: 24px; padding: 24px 16px 0; }
            .elite-title { font-size: 1.8rem; font-weight: 900; color: var(--text-main); margin-bottom: 4px; letter-spacing: -0.5px; }
            .elite-subtitle { color: var(--text-muted); font-weight: 600; font-size: 0.9rem; opacity: 0.8; }

            .stats-master-card { 
                background: var(--card-bg); border-radius: 28px; padding: 24px; 
                border: 1.5px solid var(--border-color); display: flex; flex-direction: column; gap: 20px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.04); position: relative; overflow: hidden;
            }
            .stats-main-flow { display: flex; align-items: center; justify-content: space-around; width: 100%; }
            .stat-unit { display: flex; align-items: center; gap: 12px; }
            .stat-icon-bg { width: 44px; height: 44px; border-radius: 12px; background: rgba(255, 167, 38, 0.1); color: var(--primary-color); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; }
            .stat-content { display: flex; flex-direction: column; }
            .stat-content .val { font-size: 1.6rem; font-weight: 900; color: var(--text-main); line-height: 1; }
            .stat-content .val span { font-size: 1rem; color: var(--text-light); }
            .stat-content .lbl { font-size: 0.65rem; font-weight: 800; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
            .stat-divider { width: 1.5px; height: 40px; background: var(--border-color); opacity: 0.5; }

            .progress-ring-container { position: relative; width: 50px; height: 50px; }
            .ring-svg { transform: rotate(-90deg); width: 100%; height: 100%; }
            .ring-percent { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 0.7rem; font-weight: 900; color: var(--text-main); }

            .btn-create-master { 
                background: var(--primary-color); color: white; border: none; padding: 16px; 
                border-radius: 16px; font-weight: 900; font-size: 0.85rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center; gap: 10px;
                transition: 0.3s; box-shadow: 0 8px 25px rgba(255, 167, 38, 0.2); 
            }

            /* Navigator Bar */
            .habit-navigator-bar { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; padding: 0 16px 12px 16px; border-bottom: 1.5px solid var(--border-color); }
            .pills-container { display: flex; background: var(--input-bg); padding: 5px; border-radius: 16px; gap: 4px; }
            .pill-btn { flex: 1; padding: 10px; border-radius: 12px; border: none; background: transparent; color: var(--text-muted); font-weight: 800; font-size: 0.8rem; cursor: pointer; transition: 0.3s; }
            .pill-btn.active { background: white; color: var(--primary-color); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

            .search-master-wrap { position: relative; width: 100%; }
            .search-master-wrap i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-light); }
            .search-master-wrap input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 16px; border: 1.5px solid var(--border-color); background: var(--card-bg); font-family: inherit; font-size: 0.9rem; font-weight: 600; outline: none; }

            /* Grid & Cards (5 per row on desktop) */
            .habits-grid-premium { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 16px 40px; }
            
            .habit-card-elite { position: relative !important; background: var(--card-bg); border-radius: 20px; border: 1.5px solid var(--border-color); padding: 16px; transition: 0.4s; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
            .habit-card-elite:hover { transform: translateY(-6px); border-color: var(--primary-color); }
            .habit-card-elite.is-completed { border-color: var(--success); background: linear-gradient(135deg, var(--card-bg) 0%, rgba(34, 197, 94, 0.03) 100%); }

            .card-top { display: flex; gap: 12px; align-items: center; }
            .icon-sphere { width: 44px; height: 44px; border-radius: 12px; background: var(--input-bg); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .icon-sphere img { width: 30px; height: 30px; }
            .streak-tag { position: absolute; top: -10px; right: -10px; background: #ff4757; color: white; font-size: 0.7rem; padding: 4px 8px; border-radius: 10px; font-weight: 900; border: 3px solid white; z-index: 15; box-shadow: 0 4px 10px rgba(255, 71, 87, 0.3); display: flex; align-items: center; gap: 4px; }

            .habit-title { font-size: 0.95rem; font-weight: 850; color: var(--text-main); margin-bottom: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
            .habit-badges { display: flex; gap: 6px; }
            .badge { font-size: 0.6rem; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase; }
            .freq-badge { background: var(--primary-light)15; color: var(--primary-dark); }
            .time-badge { background: var(--input-bg); color: var(--text-muted); }

            .habit-desc-minimal { font-size: 0.75rem; color: var(--text-muted); line-height: 1.4; font-weight: 500; height: 32px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }

            .habit-progress-viz { display: flex; flex-direction: column; gap: 6px; }
            .viz-dots { display: flex; gap: 4px; }
            .viz-dot { flex: 1; height: 5px; border-radius: 4px; background: var(--border-color); opacity: 0.3; }
            .viz-dot.active { background: var(--success); opacity: 1; }
            .viz-label { font-size: 0.6rem; color: var(--text-light); text-transform: uppercase; font-weight: 700; text-align: right; }

            .habit-card-footer { display: flex; gap: 8px; margin-top: auto; }
            .btn-action-checkin { flex: 1; padding: 10px; border-radius: 12px; border: none; background: var(--primary-color); color: white; font-weight: 850; font-size: 0.75rem; cursor: pointer; }
            .btn-action-delete { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid var(--border-color); background: transparent; color: var(--text-light); cursor: pointer; display: flex; align-items: center; justify-content: center; }
            .done-ribbon { flex: 1; padding: 10px; border-radius: 12px; background: rgba(34, 197, 94, 0.1); color: var(--success); font-weight: 850; font-size: 0.7rem; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1.5px solid rgba(34, 197, 94, 0.15); }

            /* Modal Style */
            .modal-elite-designer { background: var(--card-bg); border-radius: 32px; width: 95%; max-width: 450px; border: 2px solid var(--border-color); box-shadow: 0 30px 80px rgba(0,0,0,0.3); padding: 0; overflow: hidden; }
            .modal-header-banner { padding: 30px; background: var(--bg-color); display: flex; gap: 20px; align-items: center; position: relative; border-bottom: 2px solid var(--border-color); }
            .banner-icon { width: 56px; height: 56px; border-radius: 16px; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
            .banner-text h3 { font-size: 1.3rem; font-weight: 900; color: var(--text-main); }
            .modal-x-btn { position: absolute; top: 20px; right: 20px; background: none; border: none; color: var(--text-light); cursor: pointer; font-size: 1.1rem; }
            .elite-form { padding: 30px; display: flex; flex-direction: column; gap: 24px; }
            .field-group { display: flex; flex-direction: column; gap: 10px; }
            .field-group label { font-size: 0.75rem; font-weight: 900; color: var(--text-muted); text-transform: uppercase; display: flex; align-items: center; gap: 8px; }
            .field-group input, .field-group textarea, .field-group select { padding: 14px 18px; border-radius: 14px; border: 2px solid var(--border-color); background: var(--input-bg); font-family: inherit; font-size: 0.95rem; font-weight: 600; color: var(--text-main); outline: none; }
            .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .modal-footer-actions { display: flex; gap: 12px; margin-top: 10px; }
            .btn-submit-elite { flex: 1.6; padding: 16px; border-radius: 16px; border: none; background: var(--primary-color); color: white; font-weight: 900; font-size: 0.95rem; cursor: pointer; }
            .btn-cancel-elite { flex: 1; padding: 16px; border-radius: 16px; border: 2px solid var(--border-color); background: transparent; color: var(--text-muted); font-weight: 800; cursor: pointer; }

            @media (min-width: 900px) {
                .habits-premium-container { padding: 0; }
                .habits-elite-dashboard { flex-direction: row; justify-content: space-between; align-items: flex-end; }
                .stats-master-card { flex-direction: row; align-items: center; width: auto; min-width: 580px; gap: 40px; }
                .stats-main-flow { flex: 1; gap: 40px; }
                .btn-create-master { padding: 14px 32px; }
                .habit-navigator-bar { flex-direction: row; align-items: center; justify-content: space-between; }
                .pills-container { min-width: 400px; }
                .search-master-wrap { width: 300px; }
                .habits-grid-premium { grid-template-columns: repeat(5, 1fr); gap: 16px; }
            }
            @media (max-width: 900px) { .habits-grid-premium { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 480px) { .habits-grid-premium { grid-template-columns: 1fr; } }
            
            /* Empty State Animations & Layout */
            .empty-state-illust { 
                display: flex; flex-direction: column; align-items: center; justify-content: center; 
                padding: 80px 20px; text-align: center; margin: 20px auto; max-width: 600px;
                background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 100%);
                border-radius: 32px; border: 2px dashed rgba(255, 167, 38, 0.2);
            }
            .bee-hover-container { position: relative; width: 160px; height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; margin-bottom: 24px; }
            .flying-bee { 
                width: 110px; object-fit: contain; z-index: 2; 
                animation: floatBeeSmooth 3.5s ease-in-out infinite, bzzShake 8s infinite;
                filter: drop-shadow(0 15px 15px rgba(255, 167, 38, 0.15));
            }
            .bee-shadow { 
                width: 60px; height: 10px; background: rgba(0,0,0,1); border-radius: 50%; opacity: 0.15; filter: blur(4px); 
                animation: shadowPulse 3.5s ease-in-out infinite; margin-top: 15px; position: absolute; bottom: 0;
            }
            .empty-text { font-size: 0.95rem; font-weight: 600; color: var(--text-muted); margin-bottom: 32px; max-width: 320px; line-height: 1.6; }
            .empty-create-btn { padding: 16px 36px; font-size: 0.95rem; border-radius: 20px; box-shadow: 0 10px 25px rgba(255, 167, 38, 0.3); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
            .empty-create-btn:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 15px 35px rgba(255, 167, 38, 0.4); }

            @keyframes floatBeeSmooth {
                0%, 100% { transform: translateY(8px) rotate(-3deg); }
                50% { transform: translateY(-20px) rotate(4deg); }
            }
            @keyframes bzzShake {
                0%, 95%, 100% { margin-left: 0; }
                96% { margin-left: -3px; }
                97% { margin-left: 3px; }
                98% { margin-left: -3px; }
                99% { margin-left: 3px; }
            }
            @keyframes shadowPulse {
                0%, 100% { transform: scale(1); opacity: 0.15; }
                50% { transform: scale(0.65); opacity: 0.05; }
            }
        </style>
    `;

    // Re-attach Event Listeners
    const searchInput = document.getElementById('habit-search');
    searchInput.oninput = (e) => { currentFilters.search = e.target.value; updateHabitsUI(container); };

    container.querySelectorAll('.pill-btn').forEach(btn => {
        btn.onclick = () => { currentFilters.status = btn.dataset.status; updateHabitsUI(container); };
    });

    const modal = document.getElementById('habit-modal');
    document.getElementById('show-habit-modal').onclick = () => modal.style.display = 'flex';
    document.getElementById('close-h-modal').onclick = () => modal.style.display = 'none';
    document.getElementById('close-modal-x').onclick = () => modal.style.display = 'none';

    document.getElementById('habit-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            await api.post('/habits/add', data);
            modal.style.display = 'none';
            renderHabits(container); 
        } catch (err) { alert(err.message); }
    };

    container.querySelectorAll('.checkin-btn').forEach(btn => {
        btn.onclick = async () => {
            try {
                await api.post(`/habits/check-in/${btn.dataset.id}`);
                renderHabits(container);
            } catch (err) { alert(err.message); }
        };
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Lưu trữ kỷ luật này?')) {
                try {
                    await api.delete(`/habits/delete/${btn.dataset.id}`);
                    renderHabits(container);
                } catch (err) { alert(err.message); }
            }
        };
    });
};
