import api from '../utils/api.js';

let allHabits = [];
let currentFilters = { search: '', status: 'all', frequency: 'all' };

export const renderHabits = async (container) => {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted);">Khám phá lộ trình phát triển...</div>`;

    try {
        const response = await api.get('/habits/all');
        allHabits = response.habits;
        updateHabitsUI(container);
    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Lỗi: ${error.message}</div>`;
    }
};

const updateHabitsUI = (container) => {
    const filtered = allHabits.filter(h => {
        const matchesSearch = h.title.toLowerCase().includes(currentFilters.search.toLowerCase());
        const today = new Date().toISOString().slice(0, 10);
        const isDone = h.last_completed && h.last_completed.startsWith(today);
        const matchesStatus = currentFilters.status === 'all' || (currentFilters.status === 'done' ? isDone : !isDone);
        const matchesFreq = currentFilters.frequency === 'all' || h.frequency === currentFilters.frequency;
        return matchesSearch && matchesStatus && matchesFreq;
    });

    const today = new Date().toISOString().slice(0, 10);
    const completedCount = allHabits.filter(h => h.last_completed && h.last_completed.startsWith(today)).length;
    const progressPercent = allHabits.length > 0 ? Math.round((completedCount / allHabits.length) * 100) : 0;

    container.innerHTML = `
        <div class="habits-premium-root fade-in">
            <!-- Header & Dashboard Stats -->
            <div class="habits-header-premium">
                <div class="header-left">
                    <h2 class="title-gradient">Kỷ luật tự thân</h2>
                    <p>Xây dựng thói quen nhỏ, tạo thành công lớn.</p>
                </div>
                <div class="habits-stats-mini">
                    <div class="stat-item">
                        <span class="stat-value">${completedCount}/${allHabits.length}</span>
                        <span class="stat-label">Hoàn thành hôm nay</span>
                    </div>
                    <div class="stat-progress-ring">
                        <div class="progress-bar-inner" style="width: ${progressPercent}%;"></div>
                        <span class="progress-text">${progressPercent}%</span>
                    </div>
                    <button id="show-habit-modal" class="btn-create-premium">
                        <i class="fas fa-plus-circle"></i> Tạo mới
                    </button>
                </div>
            </div>

            <!-- Professional Filter Bar -->
            <div class="filter-bar-premium">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="habit-search" placeholder="Tìm thói quen..." value="${currentFilters.search}">
                </div>
                <div class="filter-groups">
                    <div class="filter-group">
                        <label>Trạng thái</label>
                        <select id="filter-status">
                            <option value="all" ${currentFilters.status === 'all' ? 'selected' : ''}>Tất cả</option>
                            <option value="incomplete" ${currentFilters.status === 'incomplete' ? 'selected' : ''}>Chưa xong</option>
                            <option value="done" ${currentFilters.status === 'done' ? 'selected' : ''}>Đã xong</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Tần suất</label>
                        <select id="filter-freq">
                            <option value="all" ${currentFilters.frequency === 'all' ? 'selected' : ''}>Tất cả</option>
                            <option value="daily" ${currentFilters.frequency === 'daily' ? 'selected' : ''}>Hàng ngày</option>
                            <option value="weekly" ${currentFilters.frequency === 'weekly' ? 'selected' : ''}>Hàng tuần</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Habits Grid -->
            ${filtered.length > 0 ? `
                <div class="habits-grid-premium">
                    ${filtered.map(habit => {
                        const isDone = habit.last_completed && habit.last_completed.startsWith(today);
                        
                        return `
                            <div class="habit-card-ultra premium ${isDone ? 'is-done' : ''}">
                                <div class="card-header">
                                    <div class="habit-icon-box" style="background: transparent !important;">
                                        <img src="${isDone ? '/complete.png' : (habit.frequency === 'daily' ? '/lightning.png' : '/thunder.png')}" class="habit-icon-img" alt="habit-icon">
                                    </div>
                                    <h4 class="habit-title">${habit.title}</h4>
                                    <!-- Mini Edit icon could go here if needed -->
                                </div>

                                <div class="card-meta-vertical">
                                    <div class="meta-row">
                                        <i class="far fa-clock"></i>
                                        <span class="meta-label">Thời gian:</span>
                                        <span class="meta-value">${habit.preferred_time ? habit.preferred_time.slice(0, 5) : 'Any'}</span>
                                    </div>
                                    <div class="meta-row">
                                        <i class="fas fa-sync-alt"></i>
                                        <span class="meta-label">Tần suất:</span>
                                        <span class="meta-value">${habit.frequency === 'daily' ? 'Hàng ngày' : 'Hàng tuần'}</span>
                                    </div>
                                    <div class="meta-row streak-highlight">
                                        <i class="fas fa-fire"></i>
                                        <span class="meta-label">Chuỗi:</span>
                                        <span class="meta-value">${habit.current_streak} ngày</span>
                                    </div>
                                </div>

                                <div class="card-progress-section">
                                    <div class="progress-track">
                                        ${Array(14).fill(0).map((_, i) => `
                                            <div class="progress-dot ${i < habit.current_streak % 14 ? 'active' : ''}" style="opacity: ${0.4 + (i * 0.05)};"></div>
                                        `).join('')}
                                    </div>
                                </div>
                                
                                <p class="card-desc">${habit.description || 'Hành động nhỏ mỗi ngày giúp bạn tiến xa hơn.'}</p>
                                
                                <div class="card-actions-group">
                                    ${!isDone ? `
                                        <button class="btn-action-delete" data-id="${habit.id}" title="Xóa thói quen">
                                            <i class="fas fa-trash-alt"></i> Xóa
                                        </button>
                                        <button class="btn-action-checkin" data-id="${habit.id}">
                                            <i class="fas fa-fingerprint"></i>
                                        </button>
                                        <button class="btn-action-complete" data-id="${habit.id}">
                                            Xong
                                        </button>
                                    ` : `
                                        <div class="done-badge-full">
                                            <i class="fas fa-check-circle"></i> Đã điểm danh!
                                        </div>
                                        <button class="btn-action-complete-secondary" data-id="${habit.id}" title="Hoàn thành thói quen vĩnh viễn">
                                            Xong
                                        </button>
                                    `}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div class="empty-state-premium">
                    <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-state-2130362-1800592.png" style="width: 200px; opacity: 0.8; filter: grayscale(1);">
                    <h3>Không tìm thấy thói quen</h3>
                    <p>Hãy thử thay đổi bộ lọc hoặc tạo lộ trình mới.</p>
                </div>
            `}

            <!-- Modal redesigned -->
            <div id="habit-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content-ultra">
                    <div class="modal-header">
                        <h3>Thiết lập thói quen</h3>
                        <p>Xây dựng lộ trình phát triển bền vững cùng PlanBee</p>
                    </div>
                    <form id="habit-form">
                        <div class="form-group">
                            <label><i class="fas fa-tag"></i> Tên thói quen</label>
                            <input type="text" name="title" placeholder="Ví dụ: Thiền định, Đọc sách 30p..." required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label><i class="fas fa-clock"></i> Giờ thực hiện</label>
                                <input type="time" name="preferred_time">
                            </div>
                            <div class="form-group">
                                <label><i class="fas fa-sync-alt"></i> Tần suất</label>
                                <select name="frequency">
                                    <option value="daily">Hàng ngày</option>
                                    <option value="weekly">Hàng tuần</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label><i class="fas fa-quote-left"></i> Mô tả & Động lực</label>
                            <textarea name="description" rows="3" placeholder="Lý do bạn bắt đầu thói quen này là gì? Trình bày ngắn gọn nhé..."></textarea>
                        </div>
                        <div class="modal-actions">
                            <button type="button" id="close-h-modal" class="btn btn-ghost">Hủy bỏ</button>
                            <button type="submit" class="btn btn-primary-premium">Kích hoạt ngay</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <style>
            .habits-premium-root { padding: 40px; display: flex; flex-direction: column; gap: 40px; }
            .habits-header-premium { display: flex; justify-content: space-between; align-items: center; }
            .title-gradient { font-size: 2.2rem; font-weight: 900; background: linear-gradient(135deg, var(--text-main), var(--primary-color)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
            .header-left p { color: var(--text-muted); font-size: 1.1rem; }
            
            .habits-stats-mini { display: flex; align-items: center; gap: 32px; background: var(--card-bg); padding: 16px 32px; border-radius: 20px; box-shadow: var(--shadow-sm); border: 1px solid var(--border-color); }
            .stat-item { display: flex; flex-direction: column; }
            .stat-value { font-size: 1.4rem; font-weight: 800; color: var(--text-main); }
            .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700; }
            
            .stat-progress-ring { position: relative; width: 60px; height: 10px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
            .progress-bar-inner { height: 100%; background: var(--primary-color); border-radius: 10px; transition: 0.5s; }
            
            .btn-create-premium { background: var(--primary-color); color: white; padding: 12px 24px; border-radius: 12px; font-weight: 800; border: none; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(255, 167, 38, 0.3); }
            .btn-create-premium:hover { transform: translateY(-3px); box-shadow: 0 6px 20px rgba(255, 167, 38, 0.4); }

            /* Filter Bar */
            .filter-bar-premium { display: flex; justify-content: space-between; align-items: center; background: var(--card-bg); padding: 20px; border-radius: 20px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
            .search-box { flex: 1; max-width: 400px; position: relative; }
            .search-box i { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
            .search-box input { width: 100%; padding: 12px 16px 12px 48px; border-radius: 12px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-family: inherit; }
            
            .filter-groups { display: flex; gap: 24px; }
            .filter-group { display: flex; flex-direction: column; gap: 4px; }
            .filter-group label { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); margin-left: 4px; }
            .filter-group select { padding: 10px 16px; border-radius: 10px; border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-main); font-weight: 600; cursor: pointer; }

            /* Habits Grid */
            .habits-grid-premium { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }

            /* Ultra Card Redesign */
            .habit-card-ultra { padding: 24px; background: var(--card-bg); border-radius: 24px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); position: relative; display: flex; flex-direction: column; gap: 20px; }
            .habit-card-ultra:hover { transform: translateY(-10px) scale(1.02); box-shadow: var(--shadow-lg); border-color: var(--primary-color); }
            
            .card-header { display: flex; align-items: center; gap: 16px; position: relative; }
            .habit-icon-box { width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; }
            .habit-icon-img { 
                width: 42px; height: 42px; object-fit: contain; 
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
                transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }
            .habit-card-ultra:hover .habit-icon-img { transform: scale(1.2) rotate(3deg); }
            .habit-title { font-size: 1.15rem; font-weight: 800; color: var(--text-main); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .delete-btn-mini { background: none; border: none; font-size: 1.2rem; color: var(--text-light); opacity: 0.4; cursor: pointer; transition: 0.2s; }
            .delete-btn-mini:hover { color: var(--danger); opacity: 1; }

            .card-meta-vertical { display: flex; flex-direction: column; gap: 10px; padding: 12px; background: rgba(0,0,0,0.02); border-radius: 16px; }
            .meta-row { display: flex; align-items: center; gap: 12px; font-size: 0.85rem; }
            .meta-row i { width: 16px; color: var(--primary-color); }
            .meta-label { color: var(--text-muted); font-weight: 600; width: 80px; }
            .meta-value { color: var(--text-main); font-weight: 800; }
            .streak-highlight .meta-value { color: #ff6b6b; }

            .card-progress-section { display: flex; flex-direction: column; gap: 8px; }
            .progress-track { display: flex; gap: 4px; }
            .progress-dot { flex: 1; height: 10px; border-radius: 10px; background: rgba(0,0,0,0.05); }
            .progress-dot.active { background: var(--success); box-shadow: 0 0 10px rgba(30, 215, 96, 0.2); }

            .card-desc { font-size: 0.85rem; color: var(--text-muted); line-height: 1.5; height: 3em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            
            .card-actions-group { display: flex; gap: 8px; margin-top: auto; align-items: stretch; justify-content: space-between; width: 100%; }
            
            .btn-action-delete, .btn-action-checkin, .btn-action-complete { flex: 1; padding: 12px 6px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 0.8rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border: none; }
            
            .btn-action-delete { border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-light); }
            .btn-action-delete:hover { background: #fee2e2; color: #ef4444; border-color: #fecaca; }

            .btn-action-checkin { background: rgba(0,0,0,0.02); color: var(--text-main); border: 2px solid var(--border-color); }
            .btn-action-checkin:hover { background: var(--input-bg); border-color: var(--primary-color); color: var(--primary-color); }

            .btn-action-complete { background: var(--primary-color); color: white; box-shadow: 0 4px 12px rgba(255, 167, 38, 0.2); }
            .btn-action-complete:hover { background: var(--primary-dark); transform: translateY(-2px); }
            
            .btn-action-complete-secondary { width: 44px; min-width: 44px; height: 44px; border-radius: 12px; background: transparent; color: var(--text-light); opacity: 0.3; cursor: pointer; transition: 0.2s; border: none; display: flex; align-items: center; justify-content: center; }
            .btn-action-complete-secondary:hover { color: var(--primary-color); opacity: 1; transform: scale(1.1); }

            .done-badge-full { flex: 1; padding: 12px; border-radius: 12px; background: rgba(30, 215, 96, 0.1); color: var(--success); font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid rgba(30, 215, 96, 0.2); font-size: 0.85rem; }
            
            .habit-card-ultra.is-done { border-color: var(--success); background: linear-gradient(to bottom right, var(--card-bg), rgba(30, 215, 96, 0.02)); }

            /* Professional Modern Modal */
            .modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center; z-index: 2000;
            }
            .modal-content-ultra {
                background: var(--card-bg); padding: 40px; border-radius: 32px;
                width: 95%; max-width: 520px; position: relative;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                border: 1px solid var(--border-color); animation: modalIn 0.3s ease-out;
            }
            @keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

            .modal-header { margin-bottom: 32px; border-bottom: 1px solid var(--border-color); padding-bottom: 20px; }
            .modal-header h3 { font-size: 1.8rem; font-weight: 900; margin-bottom: 8px; color: var(--text-main); }
            .modal-header p { color: var(--text-muted); font-size: 1rem; }

            .form-group { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
            .form-group label { font-weight: 800; color: var(--text-main); font-size: 0.95rem; display: flex; align-items: center; gap: 8px; }
            .form-group label i { color: var(--primary-color); font-size: 0.9rem; }
            
            .form-group input, .form-group select, .form-group textarea {
                width: 100%; border-radius: 14px; padding: 14px 18px; border: 2px solid var(--border-color);
                background: var(--input-bg); color: var(--text-main); font-family: inherit; font-size: 1rem;
                transition: all 0.2s ease; outline: none;
            }
            .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
                border-color: var(--primary-color); box-shadow: 0 0 0 4px rgba(255, 167, 38, 0.1); background: white;
            }

            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .form-group textarea { resize: none; min-height: 100px; }

            .modal-actions { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 32px; }
            .btn-primary-premium {
                background: var(--primary-color); color: white; padding: 14px 36px; border-radius: 16px;
                border: none; font-weight: 800; cursor: pointer; transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(255, 167, 38, 0.3); font-size: 1rem;
            }
            .btn-primary-premium:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(255, 167, 38, 0.4); }
            .btn-ghost {
                background: transparent; border: 2px solid transparent; color: var(--text-muted); padding: 13px 24px;
                border-radius: 16px; font-weight: 700; cursor: pointer; transition: 0.2s; font-size: 1rem;
            }
            .btn-ghost:hover { background: rgba(0,0,0,0.05); color: var(--text-main); }
            
            .empty-state-premium { text-align: center; padding: 100px 40px; }
            .empty-state-premium h3 { font-size: 1.4rem; margin-top: 24px; color: var(--text-main); }
            .empty-state-premium p { color: var(--text-muted); }
        </style>
    `;

    // Attach Event Listeners
    const searchInput = document.getElementById('habit-search');
    searchInput.oninput = (e) => { currentFilters.search = e.target.value; updateHabitsUI(container); };

    const statusFilter = document.getElementById('filter-status');
    statusFilter.onchange = (e) => { currentFilters.status = e.target.value; updateHabitsUI(container); };

    const freqFilter = document.getElementById('filter-freq');
    freqFilter.onchange = (e) => { currentFilters.frequency = e.target.value; updateHabitsUI(container); };

    const modal = document.getElementById('habit-modal');
    document.getElementById('show-habit-modal').onclick = () => modal.style.display = 'flex';
    document.getElementById('close-h-modal').onclick = () => modal.style.display = 'none';

    document.getElementById('habit-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        try {
            await api.post('/habits/add', data);
            modal.style.display = 'none';
            renderHabits(container); // Refresh data
        } catch (err) { alert(err.message); }
    };

    container.querySelectorAll('.btn-action-checkin').forEach(btn => {
        btn.onclick = async () => {
            try {
                await api.post(`/habits/check-in/${btn.dataset.id}`);
                renderHabits(container);
            } catch (err) { alert(err.message); }
        };
    });

    const markFinalComplete = async (id) => {
        if (confirm('Chúc mừng bạn đã chinh phục thói quen này! Bạn có muốn kết thúc lộ trình và lưu thành tích không?')) {
            try {
                await api.delete(`/habits/delete/${id}`);
                alert('Thói quen đã được hoàn thành rực rỡ! Bạn quá tuyệt vời!');
                renderHabits(container);
            } catch (err) { alert(err.message); }
        }
    };

    container.querySelectorAll('.btn-action-complete, .btn-action-complete-secondary').forEach(btn => {
        btn.onclick = () => markFinalComplete(btn.dataset.id);
    });

    container.querySelectorAll('.btn-action-delete').forEach(btn => {
        btn.onclick = async () => {
            if (confirm('Xóa thói quen này khỏi lộ trình?')) {
                try {
                    await api.delete(`/habits/delete/${btn.dataset.id}`);
                    renderHabits(container);
                } catch (err) { alert(err.message); }
            }
        };
    });
};
