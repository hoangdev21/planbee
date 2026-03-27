import api from '../utils/api.js';

let currentTab = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 15;

export const renderTasks = async (container) => {
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
        
        // 1. Process, Filter and Categorize
        const allItems = [
            ...tasksRes.tasks.map(t => ({ ...t, itemType: 'task' })),
            ...plansRes.plans.map(p => ({ ...p, itemType: 'plan' }))
        ]
        .filter(item => !item.title.startsWith('Cập nhật trạng thái')) // Filter out system tasks
        .map(item => {
            const date = new Date(item.due_date || item.start_time);
            const endDate = item.end_time ? new Date(item.end_time) : date;
            
            let status = item.status || 'pending';
            
            // Auto-complete logic for past items
            if (status !== 'completed' && status !== 'cancelled' && endDate < now) {
                status = 'completed';
            }

            let category = 'upcoming';
            if (status === 'completed') category = 'completed';
            else if (status === 'cancelled') category = 'cancelled';
            else if (now >= date && now <= endDate) category = 'in-progress';
            else if (now > endDate) category = 'completed';

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
                <div class="tasks-root fade-in" style="padding: 32px 10px;">
                    <div style="margin-bottom: 32px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 10px;">
                        <div>
                            <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">Nhiệm vụ & Kế hoạch</h2>
                            <p style="color: var(--text-muted); font-weight: 500;">Theo dõi và tối ưu hóa hiệu suất làm việc của bạn.</p>
                        </div>
                    </div>

                    <!-- Filter Tabs -->
                    <div class="filter-tabs-container" style="padding: 0 10px;">
                        ${['all', 'in-progress', 'upcoming', 'completed', 'cancelled'].map(tab => {
                            const labels = { all: 'Tất cả', 'in-progress': 'Đang làm', upcoming: 'Sắp tới', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
                            const isActive = currentTab === tab;
                            return `
                                <button class="filter-tab-btn ${isActive ? 'active' : ''}" data-tab="${tab}">
                                    ${labels[tab]}
                                    ${isActive ? `<span class="active-dot"></span>` : ''}
                                </button>
                            `;
                        }).join('')}
                    </div>

                    <div class="tasks-table-card">
                        <table class="tasks-table">
                            <thead>
                                <tr>
                                    <th style="width: 40%;">THÔNG TIN</th>
                                    <th style="width: 25%;">THỜI GIAN</th>
                                    <th style="width: 15%; text-align: center;">TRẠNG THÁI</th>
                                    <th style="width: 20%; text-align: center;">THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pageItems.length > 0 ? pageItems.map(item => {
                                    const stMap = {
                                        'in-progress': { label: 'Đang diễn ra', color: 'var(--info)', bg: 'rgba(9, 132, 227, 0.08)' },
                                        'upcoming': { label: 'Sắp tới', color: 'var(--primary-dark)', bg: 'rgba(255, 167, 38, 0.08)' },
                                        'completed': { label: 'Hoàn thành', color: 'var(--success)', bg: 'rgba(0, 184, 148, 0.08)' },
                                        'cancelled': { label: 'Đã hủy', color: 'var(--danger)', bg: 'rgba(214, 48, 49, 0.08)' }
                                    };
                                    const st = stMap[item.category] || stMap.upcoming;
                                    
                                    const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                                    const formatDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                                    
                                    // Complex Time Display
                                    let timeDisplay = '';
                                    if (item.itemType === 'plan' && item.end_time) {
                                        timeDisplay = `
                                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                                <span style="font-weight: 600; color: var(--text-main);">${formatTime(item.date)} - ${formatTime(item.endDate)}</span>
                                                <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(item.date)}</span>
                                            </div>
                                        `;
                                    } else {
                                        timeDisplay = `
                                            <div style="display: flex; flex-direction: column; gap: 2px;">
                                                <span style="font-weight: 600; color: var(--text-main);">${formatTime(item.date)}</span>
                                                <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(item.date)}</span>
                                            </div>
                                        `;
                                    }

                                    return `
                                        <tr>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 12px;">
                                                    <div class="item-icon-circle ${item.itemType}">
                                                        <i class="fas ${item.itemType === 'plan' ? 'fa-calendar-alt' : 'fa-check-double'}"></i>
                                                    </div>
                                                    <div style="display: flex; flex-direction: column;">
                                                        <span class="item-title">${item.title}</span>
                                                        <div style="display: flex; align-items: center; gap: 6px; margin-top: 4px;">
                                                            <span class="item-tag">${item.itemType === 'plan' ? 'Kế hoạch' : 'Nhiệm vụ'}</span>
                                                            <span class="priority-dot" style="background: ${item.priority === 'high' ? 'var(--danger)' : item.priority === 'low' ? 'var(--success)' : 'var(--warning)'};"></span>
                                                            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize;">${item.priority || 'Medium'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style="display: flex; align-items: center; gap: 10px;">
                                                    <i class="far fa-clock" style="color: var(--text-light); font-size: 0.9rem;"></i>
                                                    ${timeDisplay}
                                                </div>
                                            </td>
                                            <td style="text-align: center;">
                                                <span class="status-badge" style="color: ${st.color}; background: ${st.bg}; border-color: ${st.color}22;">
                                                    ${st.label}
                                                </span>
                                            </td>
                                            <td style="text-align: center;">
                                                <div style="display: flex; gap: 8px; justify-content: center;">
                                                    <button class="action-btn view-btn" data-index="${pageItems.indexOf(item)}" title="Xem chi tiết">
                                                        <i class="far fa-eye"></i>
                                                    </button>
                                                    ${item.category !== 'completed' && item.category !== 'cancelled' ? `
                                                        <button class="action-btn complete-btn" data-index="${pageItems.indexOf(item)}" title="Hoàn thành">
                                                            <i class="far fa-check-circle" style="color: var(--success);"></i>
                                                        </button>
                                                    ` : ''}
                                                    <button class="action-btn delete-btn" data-id="${item.id}" data-type="${item.itemType}" title="Xóa">
                                                        <i class="far fa-trash-alt" style="color: var(--danger);"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('') : `
                                    <tr>
                                        <td colspan="4" style="padding: 100px 0; text-align: center;">
                                            <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                                                <i class="fas fa-inbox" style="font-size: 3rem; color: var(--border-color);"></i>
                                                <div style="color: var(--text-muted); font-weight: 500;">Không tìm thấy dữ liệu phù hợp.</div>
                                            </div>
                                        </td>
                                    </tr>
                                `}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="pagination-container" style="padding: 0 10px;">
                        <div style="color: var(--text-muted); font-size: 0.9rem; font-weight: 500;">
                            Hiển thị từ <b>${start + 1}</b> đến <b>${Math.min(start + pageItems.length, filtered.length)}</b> trong số <b>${filtered.length}</b> mục
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button class="page-nav-btn" data-dir="prev" ${currentPage <= 1 ? 'disabled' : ''}>
                                <i class="fas fa-chevron-left"></i>
                            </button>
                            ${Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
                                <button class="page-num-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>
                            `).join('')}
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
                                <div id="modal-type-icon" class="item-icon-circle small"></div>
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
                        width: calc(100% - 40px);
                        max-width: 2200px;
                        min-height: calc(100vh - 120px);
                        margin: 20px auto 40px;
                        padding: 20px;
                    }
                    .tasks-table-card {
                        min-height: 680px;
                    }
                    .tasks-table {
                        table-layout: fixed;
                    }
                    
                    /* Tabs */
                    .filter-tabs-container {
                        display: flex;
                        gap: 12px;
                        margin-bottom: 24px;
                        border-bottom: 1.5px solid var(--border-color);
                        padding-bottom: 0px;
                    }
                    .filter-tab-btn {
                        padding: 12px 20px;
                        font-weight: 700;
                        font-size: 0.9rem;
                        color: var(--text-muted);
                        position: relative;
                        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                        border-bottom: 3px solid transparent;
                    }
                    .filter-tab-btn:hover {
                        color: var(--primary-dark);
                        background: rgba(255, 167, 38, 0.05);
                    }
                    .filter-tab-btn.active {
                        color: var(--primary-dark);
                        border-bottom-color: var(--primary-color);
                    }
                    .active-dot {
                        width: 4px;
                        height: 4px;
                        background: var(--primary-color);
                        border-radius: 50%;
                        display: inline-block;
                        margin-left: 6px;
                        vertical-align: middle;
                    }

                    /* Table Card */
                    .tasks-table-card {
                        background: var(--card-bg);
                        border-radius: 20px;
                        border: 1px solid var(--border-color);
                        overflow: hidden;
                        box-shadow: var(--shadow-sm);
                    }
                    .tasks-table {
                        width: 100%;
                        border-collapse: collapse;
                        table-layout: fixed;
                    }
                    .tasks-table th {
                        background: var(--sidebar-bg);
                        padding: 20px 30px;
                        text-align: left;
                        font-size: 0.85rem;
                        font-weight: 800;
                        letter-spacing: 1.2px;
                        color: var(--text-light);
                        border-bottom: 2px solid var(--border-color);
                    }
                    .tasks-table td {
                        padding: 24px 30px;
                        border-bottom: 1.5px solid var(--border-color);
                        vertical-align: middle;
                        transition: background-color 0.2s;
                    }
                    .tasks-table tr:last-child td {
                        border-bottom: none;
                    }
                    .tasks-table tr:hover td {
                        background-color: var(--primary-light);
                    }

                    /* Item styles */
                    .item-title {
                        font-weight: 800;
                        color: var(--text-main);
                        font-size: 1.15rem;
                        display: block;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        letter-spacing: -0.2px;
                    }
                    .item-icon-circle {
                        min-width: 48px;
                        height: 48px;
                        border-radius: 14px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.3rem;
                    }
                    .item-icon-circle.plan { background: rgba(9, 132, 227, 0.1); color: var(--info); }
                    .item-icon-circle.task { background: rgba(108, 92, 231, 0.1); color: #6c5ce7; }
                    .item-icon-circle.small { width: 32px; height: 32px; font-size: 0.9rem; }
                    
                    .item-tag {
                        font-size: 0.75rem;
                        font-weight: 800;
                        padding: 4px 10px;
                        border-radius: 8px;
                        background: var(--input-bg);
                        color: var(--text-muted);
                    }
                    .priority-dot {
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                    }
                    
                    /* Status and Actions */
                    .status-badge {
                        padding: 8px 18px;
                        border-radius: 30px;
                        font-size: 0.85rem;
                        font-weight: 800;
                        border: 1.5px solid transparent;
                        display: inline-block;
                        white-space: nowrap;
                    }
                    .action-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1rem;
                        color: var(--text-muted);
                        background: transparent;
                        border: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    .action-btn:hover {
                        background: var(--input-bg);
                        transform: translateY(-2px);
                        border-color: var(--border-color);
                    }
                    .action-btn i { transition: transform 0.2s; }
                    .action-btn:hover i { transform: scale(1.1); }

                    /* Pagination */
                    .pagination-container {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 32px;
                    }
                    .page-nav-btn, .page-num-btn {
                        width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border: 1.5px solid var(--border-color);
                        background: var(--card-bg);
                        color: var(--text-main);
                        font-weight: 700;
                        font-size: 0.85rem;
                        transition: all 0.2s;
                    }
                    .page-nav-btn:hover:not(:disabled), .page-num-btn:hover {
                        background: var(--input-bg);
                        border-color: var(--primary-color);
                        color: var(--primary-color);
                    }
                    .page-num-btn.active {
                        background: var(--primary-color);
                        border-color: var(--primary-color);
                        color: white;
                        box-shadow: 0 4px 12px rgba(255, 167, 38, 0.2);
                    }
                    .page-nav-btn:disabled {
                        opacity: 0.5;
                        cursor: not-allowed;
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
                        max-width: 1000px;
                        min-height: 600px;
                        border-radius: 28px;
                        overflow: hidden;
                        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
                        animation: modalSlide 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                        display: flex;
                        flex-direction: column;
                    }
                    @keyframes modalSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    
                    .modal-header {
                        padding: 18px 24px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1.5px solid var(--border-color);
                    }
                    .modal-header h3 { font-size: 1.15rem; font-weight: 800; color: var(--text-main); }
                    .modal-close-btn { font-size: 1rem; color: var(--text-light); transition: color 0.2s; background: none; border: none; padding: 5px; }
                    .modal-close-btn:hover { color: var(--danger); }
                    
                    .modal-body { padding: 24px; }
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
                typeIcon.className = `item-icon-circle small ${item.itemType}`;
                typeIcon.innerHTML = `<i class="fas ${item.itemType === 'plan' ? 'fa-calendar-alt' : 'fa-check-double'}"></i>`;

                const stLabel = item.category === 'in-progress' ? 'Đang làm' : item.category === 'completed' ? 'Hoàn thành' : item.category === 'cancelled' ? 'Đã hủy' : 'Sắp tới';
                const stColor = item.category === 'in-progress' ? 'var(--info)' : item.category === 'completed' ? 'var(--success)' : item.category === 'cancelled' ? 'var(--danger)' : 'var(--primary-color)';

                const formatTime = (d) => d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                const formatDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });

                body.innerHTML = `
                    <div class="modal-detail-grid">
                        <!-- Left Column: Primary Info -->
                        <div class="modal-detail-main">
                            <div style="margin-bottom: 32px;">
                                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                                    <span class="status-badge" style="color: ${stColor}; background: ${stColor}15; border-color: ${stColor}22; font-size: 0.7rem; padding: 4px 12px;">
                                        ${stLabel.toUpperCase()}
                                    </span>
                                    <span class="item-tag" style="background: var(--primary-color)15; color: var(--primary-dark); padding: 4px 12px;">
                                        ${item.itemType === 'plan' ? 'KHÔNG GIAN LỊCH' : 'NHIỆM VỤ CỐ ĐỊNH'}
                                    </span>
                                </div>
                                <h2 style="font-size: 2.2rem; font-weight: 900; color: var(--text-main); line-height: 1.2; letter-spacing: -0.5px;">${item.title}</h2>
                            </div>

                            <div class="desc-section">
                                <h4 style="font-size: 0.85rem; font-weight: 900; color: var(--text-light); text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                                    <i class="fas fa-align-left"></i> GHI CHÚ CHUNG
                                </h4>
                                <div class="desc-content">
                                    ${item.description || 'Không có mô tả chi tiết cho mục này. Hãy cập nhật thêm thông tin để quản lý hiệu quả hơn.'}
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
                        .modal-detail-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 40px; }
                        .desc-section { padding-top: 24px; border-top: 1.5px solid var(--border-color); }
                        .desc-content { font-size: 1rem; line-height: 1.8; color: var(--text-muted); font-weight: 500; }
                        
                        .side-item { margin-bottom: 30px; }
                        .side-item label { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 900; color: var(--text-light); margin-bottom: 12px; letter-spacing: 1px; }
                        
                        .priority-box, .time-box { padding: 16px; border-radius: 16px; border: 1.5px solid var(--border-color); }
                        .time-box { background: var(--primary-light); border-color: var(--primary-color)22; }

                        @media (max-width: 850px) {
                            .modal-detail-grid { grid-template-columns: 1fr; gap: 30px; }
                            .modal-detail-side { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                            .side-item:last-child { grid-column: span 2; }
                        }
                        @media (max-width: 550px) {
                            .modal-detail-side { grid-template-columns: 1fr; }
                            .side-item:last-child { grid-column: auto; }
                            .modal-content { max-height: 90vh !important; overflow-y: auto !important; }
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
