import api from '../utils/api.js';
import { parseToLocalDate } from '../utils/dateFormatter.js';

let currentTab = 'all';
let currentPage = 1;
let viewMode = 'grid';
const ITEMS_PER_PAGE = 15;

export const renderTasks = async (container, params = {}) => {
    container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 300px; flex-direction: column; gap: 16px;">
            <div class="loading-spinner"></div>
            <div style="color: var(--text-muted); font-weight: 500;">Đang tải dữ liệu...</div>
        </div>
        <style>
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid var(--border-color);
                border-top: 3px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
    `;

    try {
        const [tasksRes, plansRes] = await Promise.all([
            api.get('/tasks/all'),
            api.get('/plans/all')
        ]);
        
        const now = new Date();
        const initialTab = (params.tab || '').trim();
        if (initialTab) currentTab = initialTab;
        
        // 1. Process, Filter and Categorize
        const allItems = [
            ...tasksRes.tasks.map(t => ({ ...t, itemType: 'task' })),
            ...plansRes.plans.map(p => ({ ...p, itemType: 'plan' }))
        ]
        .filter(item => !item.title.startsWith('Cập nhật trạng thái')) // Filter out system tasks
        .map(item => {
            const date = parseToLocalDate(item.due_date || item.start_time) || new Date(item.due_date || item.start_time);
            const endDate = item.end_time
                ? (parseToLocalDate(item.end_time) || new Date(item.end_time))
                : date;
            
            let status = item.status || 'pending';

            let category = 'upcoming';
            if (status === 'completed') category = 'completed';
            else if (status === 'cancelled') category = 'cancelled';
            else if (endDate < now) category = 'overdue';
            else if (now >= date && now <= endDate) category = 'in-progress';

            return { ...item, status, category, date, endDate };
        }).sort((a, b) => a.date - b.date);

        const renderTable = () => {
            // 2. Filter by tab
            const filtered = allItems.filter(item => {
                if (currentTab === 'all') return true;
                return item.category === currentTab;
            });

            // 3. Paginate
            const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
            if (currentPage > totalPages) currentPage = totalPages;
            const start = (currentPage - 1) * ITEMS_PER_PAGE;
            const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

            container.innerHTML = `
                <div class="tasks-root fade-in">
                    <div class="tasks-header-section">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                            <div>
                                <h2 class="page-title">Nhiệm vụ & Kế hoạch</h2>
                                <p class="page-subtitle">Theo dõi và tối ưu hóa hiệu suất làm việc của bạn.</p>
                            </div>
                            <div class="view-toggle-container">
                                <button class="view-mode-btn ${viewMode === 'grid' ? 'active' : ''}" data-mode="grid" title="Xem dạng lưới">
                                    <i class="fas fa-th-large"></i>
                                </button>
                                <button class="view-mode-btn ${viewMode === 'list' ? 'active' : ''}" data-mode="list" title="Xem dạng danh sách">
                                    <i class="fas fa-list"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="filter-tabs-wrapper">
                        <div class="filter-tabs-container">
                            ${['all', 'overdue', 'in-progress', 'upcoming', 'completed', 'cancelled'].map(tab => {
                                const labels = { all: 'Tất cả', overdue: 'Quá hạn', 'in-progress': 'Đang làm', upcoming: 'Sắp tới', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
                                const isActive = currentTab === tab;
                                return `
                                    <button class="filter-tab-btn ${isActive ? 'active' : ''}" data-tab="${tab}">
                                        ${labels[tab]}
                                        ${isActive ? `<span class="active-dot"></span>` : ''}
                                    </button>
                                `;
                            }).join('')}
                        </div>
                    </div>

                    <div class="${viewMode === 'grid' ? 'tasks-grid' : 'tasks-list'}">
                        ${pageItems.length > 0 ? pageItems.map(item => {
                            const stMap = {
                                'in-progress': { label: 'Đang làm', color: 'var(--info)', bg: 'rgba(9, 132, 227, 0.08)' },
                                'upcoming': { label: 'Sắp tới', color: 'var(--primary-dark)', bg: 'rgba(255, 167, 38, 0.08)' },
                                'completed': { label: 'Hoàn thành', color: 'var(--success)', bg: 'rgba(0, 184, 148, 0.08)' },
                                'cancelled': { label: 'Đã hủy', color: 'var(--danger)', bg: 'rgba(214, 48, 49, 0.08)' }
                            };
                            const st = stMap[item.category] || stMap.upcoming;
                            
                            const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            const formatDate = (d) => `Ngày ${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
                            
                            const isPlan = item.itemType === 'plan';
                            const timeStr = isPlan && item.end_time ? `${formatTime(item.date)} - ${formatTime(item.endDate)}` : formatTime(item.date);

                            if (viewMode === 'grid') {
                                return `
                                    <div class="task-card ${item.category}" data-id="${item.id}">
                                        <div class="task-card-main">
                                            <div class="task-card-header">
                                                <div class="task-icon-wrapper">
                                                    <img src="${item.category === 'completed' ? '/complete.png?v=3' : '/calendar.png?v=2'}" class="task-card-icon" alt="icon">
                                                </div>
                                                <div class="task-card-title-group">
                                                    <h3 class="task-card-title">${item.title}</h3>
                                                    <div class="task-card-tags">
                                                        <span class="task-type-tag">${isPlan ? 'Kế hoạch' : 'Nhiệm vụ'}</span>
                                                        <div class="task-priority-group">
                                                            <span class="priority-dot" style="background: ${item.priority === 'high' ? 'var(--danger)' : item.priority === 'low' ? 'var(--success)' : 'var(--warning)'};"></span>
                                                            <span class="priority-text">${item.priority || 'Medium'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="task-card-content">
                                                <div class="time-info-box">
                                                    <div class="time-row">
                                                        <i class="far fa-clock"></i>
                                                        <span class="time-val">${timeStr}</span>
                                                    </div>
                                                    <div class="date-row">
                                                        <span>${formatDate(item.date)}</span>
                                                    </div>
                                                </div>

                                                <div class="card-action-trigger">
                                                    ${item.category !== 'completed' && item.category !== 'cancelled' ? `
                                                        <button class="card-complete-btn complete-btn" data-index="${pageItems.indexOf(item)}">
                                                            Hoàn thành
                                                        </button>
                                                    ` : `
                                                        <div class="card-status-label" style="color: ${st.color}; background: ${st.bg};">
                                                            ${st.label}
                                                        </div>
                                                    `}
                                                </div>
                                            </div>
                                        </div>

                                        <div class="task-divider"></div>

                                        <div class="task-card-footer">
                                            <div class="task-card-actions">
                                                <button class="card-action-btn view-btn" data-index="${pageItems.indexOf(item)}" title="Xem chi tiết">
                                                    <i class="far fa-eye"></i>
                                                </button>
                                                <button class="card-action-btn delete-btn" data-id="${item.id}" data-type="${item.itemType}" title="Xóa">
                                                    <i class="far fa-trash-alt"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            } else {
                                // List View Item
                                return `
                                    <div class="task-list-item ${item.category}" data-index="${pageItems.indexOf(item)}" data-id="${item.id}">
                                        <div class="list-item-status">
                                            <img src="${item.category === 'completed' ? '/complete.png?v=3' : '/calendar.png?v=2'}" class="list-item-icon" alt="icon">
                                        </div>
                                        <div class="list-item-content">
                                            <div class="list-item-main-info">
                                                <span class="list-item-title">${item.title}</span>
                                                <span class="list-item-type">${isPlan ? 'Lịch' : 'NV'}</span>
                                            </div>
                                            <div class="list-item-meta">
                                                <span class="list-item-time"><i class="far fa-clock"></i> ${timeStr}</span>
                                                <span class="list-item-priority" style="color: ${item.priority === 'high' ? 'var(--danger)' : 'var(--text-muted)'};">
                                                    <span class="priority-dot" style="background: ${item.priority === 'high' ? 'var(--danger)' : item.priority === 'low' ? 'var(--success)' : 'var(--warning)'};"></span>
                                                    ${item.priority || 'Medium'}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="list-item-actions">
                                            <button class="list-action-btn view-btn" data-index="${pageItems.indexOf(item)}">
                                                <i class="far fa-eye"></i>
                                            </button>
                                            ${item.category !== 'completed' && item.category !== 'cancelled' ? `
                                                <button class="list-action-btn complete-btn" data-index="${pageItems.indexOf(item)}">
                                                    <i class="fas fa-check-double"></i>
                                                </button>
                                            ` : ''}
                                            <button class="list-action-btn delete-btn" data-id="${item.id}" data-type="${item.itemType}">
                                                <i class="far fa-trash-alt"></i>
                                            </button>
                                        </div>
                                    </div>
                                `;
                            }
                        }).join('') : `
                            <div class="empty-results">
                                <i class="fas fa-inbox"></i>
                                <p>Không tìm thấy dữ liệu phù hợp.</p>
                            </div>
                        `}
                    </div>

                    <!-- Pagination -->
                    <div class="pagination-footer">
                        <div class="pagination-info">
                            Hiển thị từ <b>${start + 1}</b> đến <b>${Math.min(start + pageItems.length, filtered.length)}</b> trong số <b>${filtered.length}</b> mục
                        </div>
                        <div class="pagination-controls">
                            <button class="page-nav-btn" data-dir="prev" ${currentPage <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            <div class="page-numbers">
                                ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                                    <button class="page-num-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
                                `).join('')}
                            </div>
                            <button class="page-nav-btn" data-dir="next" ${currentPage >= totalPages ? 'disabled' : ''}>
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Detail Modal -->
                <div id="task-detail-modal" class="modal-overlay">
                    <div class="modal-content">
                        <div class="modal-header">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <div id="modal-type-icon" class="item-icon-view small"></div>
                                <h3 id="modal-title-text">Chi tiết</h3>
                            </div>
                            <button id="close-modal-top" class="modal-close-btn"><i class="fas fa-times"></i></button>
                        </div>
                        <div id="modal-body" class="modal-body">
                            <!-- Dynamic Content -->
                        </div>
                        <div class="modal-footer">
                            <button id="close-modal-btn" class="secondary-btn">Đóng lại</button>
                        </div>
                    </div>
                </div>

                <style>
                    .tasks-root {
                        width: 100%;
                        margin: 0;
                        padding: 0;
                        min-height: 100vh;
                    }

                    .tasks-header-section { margin-bottom: 24px; padding: 24px 16px 0; }
                    .view-toggle-container {
                        display: flex;
                        gap: 8px;
                        background: var(--input-bg);
                        padding: 4px;
                        border-radius: 12px;
                    }
                    .view-mode-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        border: none;
                        background: transparent;
                        color: var(--text-light);
                        cursor: pointer;
                        transition: all 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .view-mode-btn.active {
                        background: var(--card-bg);
                        color: var(--primary-color);
                        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
                    }
                    .page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-main); margin-bottom: 4px; }
                    .page-subtitle { color: var(--text-muted); font-size: 0.95rem; font-weight: 500; }

                    /* Tabs Scrollable */
                    .filter-tabs-wrapper {
                        margin: 0 0 24px;
                        padding: 0 16px;
                        overflow: hidden;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .filter-tabs-container {
                        display: flex;
                        gap: 8px;
                        overflow-x: auto;
                        scroll-behavior: smooth;
                        -webkit-overflow-scrolling: touch;
                        scrollbar-width: none;
                    }
                    .filter-tabs-container::-webkit-scrollbar { display: none; }
                    
                    .filter-tab-btn {
                        padding: 12px 16px;
                        font-weight: 700;
                        font-size: 0.9rem;
                        color: var(--text-muted);
                        white-space: nowrap;
                        position: relative;
                        transition: all 0.2s;
                    }
                    .filter-tab-btn.active { color: var(--primary-dark); }
                    .filter-tab-btn.active::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 16px;
                        right: 16px;
                        height: 3px;
                        background: var(--primary-color);
                        border-radius: 4px 4px 0 0;
                    }
                    .active-dot {
                        display: inline-block;
                        width: 4px;
                        height: 4px;
                        background: var(--primary-color);
                        border-radius: 50%;
                        margin-bottom: 2px;
                        margin-left: 4px;
                    }

                    /* Grid Layout */
                    .tasks-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                        padding: 0 16px;
                    }

                    @media (max-width: 768px) {
                        .tasks-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 12px;
                            padding: 0 16px 0 12px; /* Balanced mobile padding */
                        }
                    }

                    @media (max-width: 480px) {
                        .tasks-grid {
                            gap: 8px;
                            padding: 0 12px 0 10px;
                        }
                        .page-title { font-size: 1.5rem; }
                    }

                    /* Card Design */
                    .task-card {
                        background: var(--card-bg); 
                        border-radius: 20px; /* Slimmer radius */
                        border: 1.5px solid var(--border-color);
                        display: flex;
                        flex-direction: column;
                        transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        position: relative;
                        box-shadow: var(--shadow-sm);
                        overflow: hidden; /* Prevent text overflow */
                    }
                    [data-theme="light"] .task-card { background: #FFF9F0; border-color: rgba(255, 167, 38, 0.12); }

                    .task-card:hover { 
                        transform: translateY(-6px); 
                        box-shadow: 0 12px 30px rgba(255, 167, 38, 0.15); 
                        border-color: var(--primary-color);
                    }
                    .task-card.completed { 
                        background: rgba(34, 197, 94, 0.05) !important; 
                        border-color: rgba(34, 197, 94, 0.15) !important;
                        opacity: 0.9;
                    }
                    [data-theme="light"] .task-card.completed { background: #f0fdf4 !important; }


                    .task-card-main { padding: 14px 12px 10px; flex: 1; }
                    
                    .task-card-header {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 12px;
                        align-items: flex-start;
                    }
                    .task-icon-wrapper {
                        width: 38px;
                        height: 38px;
                        min-width: 38px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 10px;
                        background: var(--primary-light)15;
                    }
                    .task-card-icon {
                        width: 28px;
                        height: 28px;
                        object-fit: contain;
                    }

                    .task-card-title-group { flex: 1; min-width: 0; }
                    .task-card-title {
                        font-size: 0.95rem; /* Compact font */
                        font-weight: 800;
                        color: var(--text-main);
                        margin-bottom: 4px;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        letter-spacing: -0.3px;
                    }
                    .task-card-tags {
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    }
                    .task-type-tag {
                        font-size: 0.6rem; /* Smaller tag */
                        font-weight: 850;
                        padding: 3px 8px;
                        border-radius: 6px;
                        background: var(--sidebar-bg);
                        color: var(--text-muted);
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        white-space: nowrap; /* Prevent wrap as requested */
                    }
                    .task-priority-group {
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        padding: 2px 6px;
                        border-radius: 6px;
                        background: rgba(255,255,255,0.05);
                    }
                    [data-theme="light"] .task-priority-group { background: rgba(0,0,0,0.03); }

                    .priority-dot { width: 5px; height: 5px; border-radius: 50%; }
                    .priority-text { font-size: 0.6rem; font-weight: 700; color: var(--text-light); }

                    .task-card-content { display: flex; flex-direction: column; gap: 12px; }

                    .time-info-box {
                        padding: 8px 10px;
                        background: var(--bg-color);
                        border-radius: 12px;
                        border: 1px solid var(--border-color)44;
                    }
                    .time-row {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 2px;
                    }
                    .time-row i { font-size: 0.8rem; color: var(--text-light); }
                    .time-val { font-size: 0.85rem; font-weight: 700; color: var(--text-main); }
                    .date-row { font-size: 0.75rem; color: var(--text-muted); padding-left: 24px; font-weight: 600; }

                    .card-complete-btn {
                        width: 100%;
                        padding: 10px;
                        border-radius: 12px;
                        border: 1.5px solid var(--primary-color);
                        background: transparent;
                        color: var(--primary-color);
                        font-weight: 850;
                        font-size: 0.8rem;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        cursor: pointer;
                    }
                    .card-complete-btn:hover {
                        background: var(--primary-color);
                        color: white;
                        box-shadow: 0 6px 15px var(--primary-color)44;
                    }
                    .card-status-label {
                        width: 100%;
                        padding: 10px;
                        border-radius: 12px;
                        text-align: center;
                        font-size: 0.8rem;
                        font-weight: 850;
                    }

                    .task-divider {
                        height: 1px;
                        border-top: 1px dashed var(--border-color);
                        margin: 0 12px;
                        opacity: 0.5;
                    }

                    .task-card-footer {
                        padding: 10px 12px;
                    }
                    .task-card-actions {
                        display: flex;
                        justify-content: center;
                        gap: 24px;
                    }
                    .card-action-btn {
                        background: none;
                        border: none;
                        padding: 6px;
                        font-size: 1.1rem;
                        color: var(--text-light);
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .card-action-btn:hover { color: var(--primary-color); transform: scale(1.1); }
                    .card-action-btn:last-child:hover { color: var(--danger); }

                    /* List View Design */
                    .tasks-list {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                        padding: 0 16px 40px;
                    }
                    .task-list-item {
                        background: var(--card-bg);
                        border-radius: 16px;
                        border: 1.5px solid var(--border-color);
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        transition: all 0.2s;
                    }
                    [data-theme="light"] .task-list-item { background: #FFF9F0; border-color: rgba(255, 167, 38, 0.1); }
                    .task-list-item:hover { border-color: var(--primary-color); transform: translateX(5px); }
                    [data-theme="light"] .task-list-item:hover { background: #FFF5E6; }
                    .task-list-item.completed { background: rgba(34, 197, 94, 0.05); border-color: rgba(34, 197, 94, 0.1); }
                    [data-theme="light"] .task-list-item.completed { background: #f0fdf4; }

                    
                    .list-item-icon {
                        width: 32px;
                        height: 32px;
                        object-fit: contain;
                        margin-right: 16px;
                    }
                    .list-item-content { flex: 1; min-width: 0; }
                    .list-item-main-info { display: flex; align-items: center; gap: 8px; margin-bottom: 2px; }
                    .list-item-title { font-weight: 700; color: var(--text-main); font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                    .list-item-type { font-size: 0.6rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); opacity: 0.7; }
                    
                    .list-item-meta { display: flex; align-items: center; gap: 16px; }
                    .list-item-time { font-size: 0.8rem; color: var(--text-muted); font-weight: 600; display: flex; align-items: center; gap: 4px; }
                    .list-item-priority { font-size: 0.75rem; font-weight: 700; text-transform: capitalize; display: flex; align-items: center; gap: 4px; }
                    
                    .list-item-actions { display: flex; gap: 12px; margin-left: 16px; }
                    .list-action-btn { background: none; border: none; color: var(--text-light); font-size: 1rem; cursor: pointer; transition: color 0.2s; padding: 4px; }
                    .list-action-btn:hover { color: var(--primary-color); }
                    .list-action-btn.delete-btn:hover { color: var(--danger); }

                    /* Empty State */
                    .empty-results {
                        grid-column: 1 / -1;
                        padding: 80px 0;
                        text-align: center;
                        background: var(--card-bg);
                        border-radius: 24px;
                        border: 1px dashed var(--border-color);
                        margin: 0 16px;
                    }
                    .empty-results i { font-size: 3rem; color: var(--border-color); margin-bottom: 20px; }
                    .empty-results p { color: var(--text-muted); font-weight: 600; font-size: 1.1rem; }

                    /* Pagination */
                    .pagination-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        flex-wrap: wrap;
                        gap: 16px;
                        padding: 0 16px 40px;
                    }
                    .pagination-info { font-size: 0.85rem; color: var(--text-muted); font-weight: 500; }
                    .pagination-controls { display: flex; align-items: center; gap: 12px; }
                    .page-numbers { display: flex; gap: 6px; }

                    .page-nav-btn, .page-num-btn {
                        width: 32px;
                        height: 32px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1px solid var(--border-color);
                        background: var(--card-bg);
                        color: var(--text-main);
                        font-weight: 600;
                        font-size: 0.8rem;
                        transition: all 0.2s;
                    }
                    .page-num-btn.active {
                        background: var(--primary-color);
                        border-color: var(--primary-color);
                        color: white;
                    }
                    .page-nav-btn:disabled { opacity: 0.4; cursor: not-allowed; }

                    @media (max-width: 600px) {
                        .pagination-footer { flex-direction: column; align-items: center; }
                        .pagination-info { order: 2; }
                        .pagination-controls { order: 1; }
                    }

                    /* Modal */
                    .modal-overlay {
                        display: none;
                        position: fixed;
                        inset: 0;
                        background: rgba(0, 0, 0, 0.6);
                        backdrop-filter: blur(4px);
                        z-index: 10000;
                        align-items: center;
                        justify-content: center;
                    }
                    .modal-content {
                        background: var(--card-bg);
                        width: 95%;
                        max-width: 550px;
                        height: fit-content;
                        max-height: 90vh;
                        border-radius: 28px;
                        overflow: hidden;
                        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
                        animation: modalSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        display: flex;
                        flex-direction: column;
                    }
                    @keyframes modalSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    
                    .modal-header {
                        padding: 14px 20px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid var(--border-color);
                    }
                    .modal-header h3 { font-size: 1rem; font-weight: 800; color: var(--text-main); }
                    .modal-close-btn { font-size: 0.9rem; color: var(--text-light); transition: color 0.2s; background: none; border: none; padding: 4px; }
                    .modal-close-btn:hover { color: var(--danger); }
                    
                    .modal-body { padding: 20px; }
                    .modal-footer {
                        padding: 16px 24px;
                        background: var(--bg-color);
                        display: flex;
                        justify-content: flex-end;
                        border-top: 1px solid var(--border-color);
                    }
                    .secondary-btn {
                        padding: 8px 20px;
                        border-radius: 10px;
                        border: 1.5px solid var(--border-color);
                        background: var(--card-bg);
                        font-weight: 700;
                        font-size: 0.9rem;
                        color: var(--text-main);
                        transition: all 0.2s;
                    }
                    .secondary-btn:hover { background: var(--input-bg); transform: translateY(-1px); }
                </style>
            `;

            // Listeners
            container.querySelectorAll('.view-mode-btn').forEach(btn => {
                btn.onclick = () => { viewMode = btn.dataset.mode; renderTable(); };
            });

            container.querySelectorAll('.filter-tab-btn').forEach(btn => {
                btn.onclick = () => { currentTab = btn.dataset.tab; currentPage = 1; renderTable(); };
            });

            container.querySelectorAll('.page-nav-btn, .page-num-btn').forEach(btn => {
                btn.onclick = () => {
                    if (btn.dataset.dir === 'prev' && currentPage > 1) currentPage--;
                    else if (btn.dataset.dir === 'next' && currentPage < totalPages) currentPage++;
                    else if (btn.dataset.page) currentPage = parseInt(btn.dataset.page);
                    renderTable();
                };
            });

            const showDetail = (item) => {
                const modal = document.getElementById('task-detail-modal');
                const body = document.getElementById('modal-body');
                const titleText = document.getElementById('modal-title-text');
                const typeIcon = document.getElementById('modal-type-icon');
                
                titleText.textContent = item.itemType === 'plan' ? 'Kế hoạch chi tiết' : 'Nhiệm vụ chi tiết';
                typeIcon.className = `item-icon-view small`;
                typeIcon.innerHTML = `<img src="${item.status === 'completed' ? '/complete.png?v=2' : '/calendar.png?v=2'}" class="item-type-icon-new" alt="icon">`;

                const stLabel = item.category === 'in-progress' ? 'Đang làm' : item.category === 'completed' ? 'Hoàn thành' : item.category === 'cancelled' ? 'Đã hủy' : 'Sắp tới';
                const stColor = item.category === 'in-progress' ? 'var(--info)' : item.category === 'completed' ? 'var(--success)' : item.category === 'cancelled' ? 'var(--danger)' : 'var(--primary-color)';

                const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const formatDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });

                body.innerHTML = `
                    <div class="modal-detail-grid">
                        <!-- Left Column: Primary Info -->
                        <div class="modal-detail-main">
                            <div style="margin-bottom: 24px;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <span class="status-badge" style="color: ${stColor}; background: ${stColor}15; border-color: ${stColor}22; font-size: 0.65rem; padding: 4px 10px;">
                                        ${stLabel.toUpperCase()}
                                    </span>
                                    <span class="item-tag" style="background: var(--primary-color)15; color: var(--primary-dark); padding: 4px 10px; font-size: 0.65rem;">
                                        ${item.itemType === 'plan' ? 'KHÔNG GIAN LỊCH' : 'NHIỆM VỤ CỐ ĐỊNH'}
                                    </span>
                                </div>
                                <h2 style="font-size: 1.4rem; font-weight: 900; color: var(--text-main); line-height: 1.2; letter-spacing: -0.3px;">${item.title}</h2>
                            </div>

                            <div class="desc-section">
                                <h4 style="font-size: 0.7rem; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                                    <i class="fas fa-align-left"></i> GHI CHÚ CHUNG
                                </h4>
                                <div class="desc-content" style="font-size: 0.9rem;">
                                    ${item.description || 'Không có mô tả chi tiết cho mục này.'}
                                </div>
                            </div>
                        </div>

                        <!-- Right Column: Metadata -->
                        <div class="modal-detail-side">
                            <div class="side-item">
                                <label><i class="fas fa-flag"></i> MỨC ĐỘ ƯU TIÊN</label>
                                <div class="priority-box" style="border-left: 5px solid ${item.priority === 'high' ? 'var(--danger)' : item.priority === 'low' ? 'var(--success)' : 'var(--warning)'}; background: ${item.priority === 'high' ? 'rgba(214, 48, 49, 0.08)' : 'var(--card-bg)'};">
                                    <span style="font-weight: 800; color: var(--text-main); font-size: 1.1rem; text-transform: capitalize;">${item.priority || 'Medium'}</span>
                                    <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; font-weight: 500;">Xếp hạng độ quan trọng của công việc.</p>
                                </div>
                            </div>

                            <div class="side-item">
                                <label><i class="far fa-clock"></i> THỜI GIAN ẤN ĐỊNH</label>
                                <div class="time-box">
                                    <div style="font-weight: 800; font-size: 1rem; color: var(--text-main);">${formatDate(item.date)}</div>
                                    <div style="font-weight: 700; color: var(--primary-color); font-size: 0.9rem; margin-top: 4px;">
                                        ${formatTime(item.date)} ${item.itemType === 'plan' && item.end_time ? ` <i class="fas fa-long-arrow-alt-right"></i> ${formatTime(new Date(item.end_time))}` : ''}
                                    </div>
                                </div>
                            </div>

                            <div class="side-item">
                                <label><i class="fas fa-fingerprint"></i> MÃ ĐỊNH DANH</label>
                                <code style="font-size: 0.75rem; opacity: 0.6; display: block; border-radius: 8px; padding: 8px; background: var(--input-bg); border: 1px dashed var(--border-color);">${item.id || 'N/A'}</code>
                            </div>
                        </div>
                    </div>

                    <style>
                        .item-type-icon-new {
                            width: 32px;
                            height: 32px;
                            object-fit: contain;
                        }
                        .modal-detail-grid { display: flex; flex-direction: column; gap: 20px; }
                        .desc-section { padding-top: 12px; border-top: 1px solid var(--border-color); }
                        .desc-content { font-size: 0.9rem; line-height: 1.5; color: var(--text-muted); font-weight: 500; }
                        
                        .side-item { margin-bottom: 16px; }
                        .side-item label { display: flex; align-items: center; gap: 8px; font-size: 0.65rem; font-weight: 900; color: var(--text-light); margin-bottom: 8px; letter-spacing: 0.5px; }
                        
                        .priority-box, .time-box { padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); }
                        .time-box { background: var(--primary-light); border-color: var(--primary-color)22; }

                        .priority-box span { font-size: 0.95rem !important; }
                        .time-box div { font-size: 0.9rem !important; }

                        @media (max-width: 550px) {
                            .modal-content { width: 100%; border-radius: 24px 24px 0 0; position: fixed; bottom: 0; max-height: 85vh; }
                            .modal-overlay { align-items: flex-end; }
                        }
                    </style>
                `;
                modal.style.display = 'flex';
            };

            container.querySelectorAll('.view-btn').forEach(btn => {
                btn.onclick = () => showDetail(pageItems[btn.dataset.index]);
            });

            document.getElementById('close-modal-top').onclick = () => document.getElementById('task-detail-modal').style.display = 'none';
            document.getElementById('close-modal-btn').onclick = () => document.getElementById('task-detail-modal').style.display = 'none';

            container.querySelectorAll('.complete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const item = pageItems[btn.dataset.index];
                    if (confirm(`Bạn muốn đánh dấu "${item.title}" là hoàn thành?`)) {
                        try {
                            const endpoint = item.itemType === 'plan' ? `/plans/update/${item.id}` : `/tasks/update/${item.id}`;
                            await api.put(endpoint, { status: 'completed' });
                            // Update local data to reflect change without full reload
                            item.status = 'completed';
                            item.category = 'completed';
                            renderTable();
                        } catch (err) { alert('Lỗi: ' + err.message); }
                    }
                };
            });

            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    const id = btn.dataset.id;
                    const type = btn.dataset.type;
                    if (confirm('Dữ liệu sẽ bị xóa vĩnh viễn. Bạn chắc chắn?')) {
                        try {
                            const endpoint = type === 'plan' ? `/plans/delete/${id}` : `/tasks/delete/${id}`;
                            await api.delete(endpoint);
                            // Refresh page
                            renderTasks(container);
                        } catch (err) { alert(err.message); }
                    }
                };
            });

            // AUTO-DETAIL & SCROLL LOGIC
            if (params.id) {
                const targetId = params.id;
                const targetItem = allItems.find(item => item.id == targetId);
                
                if (targetItem) {
                    // Try to find if item is in current page/tab
                    const isInCurrentList = pageItems.some(item => item.id == targetId);
                    
                    if (!isInCurrentList) {
                        // Switch tab or page if needed
                        if (currentTab !== targetItem.category && currentTab !== 'all') {
                            currentTab = 'all'; 
                            return renderTable();
                        }
                    }

                    setTimeout(() => {
                        const targetEl = container.querySelector(`.task-card[data-id="${targetId}"], .task-list-item[data-id="${targetId}"]`);
                        if (targetEl) {
                            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            targetEl.style.boxShadow = '0 0 20px var(--primary-color)';
                            targetEl.style.borderColor = 'var(--primary-color)';
                            setTimeout(() => { targetEl.style.boxShadow = ''; targetEl.style.borderColor = ''; }, 3000);
                            
                            // Auto-show detail
                            showDetail(targetItem);
                        }
                    }, 500);
                }
            }
        };

        renderTable();

    } catch (error) {
        container.innerHTML = `
            <div style="padding: 100px; text-align: center;">
                <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: #FFEBEE; color: var(--danger); font-size: 1.5rem; margin-bottom: 20px;">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h3 style="margin-bottom: 8px;">Rất tiếc, đã xảy ra lỗi</h3>
                <p style="color: var(--text-muted);">${error.message}</p>
                <button onclick="location.reload()" class="secondary-btn" style="margin-top: 24px;">Thử lại</button>
            </div>
        `;
    }
};
