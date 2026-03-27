import api from '../utils/api.js';

let currentTab = 'all';
let currentPage = 1;
const ITEMS_PER_PAGE = 15;

export const renderTasks = async (container) => {
    container.innerHTML = `<div style="padding: 40px; text-align: center;">Đang tải dữ liệu...</div>`;

    try {
        const tasksRes = await api.get('/tasks/all');
        const plansRes = await api.get('/plans/all');
        
        const now = new Date();
        
        // 1. Process and Categorize
        const allItems = [
            ...tasksRes.tasks.map(t => ({ ...t, itemType: 'task' })),
            ...plansRes.plans.map(p => ({ ...p, itemType: 'plan' }))
        ].map(item => {
            const date = new Date(item.due_date || item.start_time);
            const endDate = item.end_time ? new Date(item.end_time) : date;
            
            let status = item.status || 'pending';
            
            // Auto-complete logic: If overdue and not cancelled
            if (status !== 'completed' && status !== 'cancelled' && endDate < now) {
                status = 'completed';
                // In a real app, you'd call an API here to persist the auto-completion
            }

            let category = 'upcoming';
            if (status === 'completed') category = 'completed';
            else if (status === 'cancelled') category = 'cancelled';
            else if (now >= date && now <= endDate) category = 'in-progress';
            else if (now > endDate) category = 'completed';

            return { ...item, status, category, date };
        }).sort((a, b) => a.date - b.date);

        const renderTable = () => {
            // 2. Filter
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
                <div class="tasks-root fade-in" style="padding: 24px;">
                    <div style="margin-bottom: 30px;">
                        <h2 style="font-size: 1.6rem; font-weight: 800; color: var(--text-main);">Nhiệm vụ & Kế hoạch</h2>
                        <p style="color: var(--text-muted);">Quản lý tiến độ công việc của bạn hiệu quả.</p>
                    </div>

                    <!-- Filter Tabs -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 8px;">
                        ${['all', 'in-progress', 'upcoming', 'completed', 'cancelled'].map(tab => {
                            const labels = { all: 'Tất cả', 'in-progress': 'Đang diễn ra', upcoming: 'Sắp tới', completed: 'Hoàn thành', cancelled: 'Đã hủy' };
                            const isActive = currentTab === tab;
                            return `<button class="filter-tab-btn" data-tab="${tab}" style="padding: 8px 18px; border-radius: 20px; border: 1px solid ${isActive ? 'var(--primary-color)' : 'var(--border-color)'}; background: ${isActive ? 'var(--primary-color)' : 'white'}; color: ${isActive ? 'white' : 'var(--text-muted)'}; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; white-space: nowrap;">${labels[tab]}</button>`;
                        }).join('')}
                    </div>

                    <div style="background: white; border-radius: 16px; border: 1px solid var(--border-color); overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #f8f9fa; border-bottom: 1.5px solid var(--border-color);">
                                    <th style="padding: 18px; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Thông tin</th>
                                    <th style="padding: 18px; text-align: left; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Thời gian</th>
                                    <th style="padding: 18px; text-align: center; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Trạng thái</th>
                                    <th style="padding: 18px; text-align: center; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${pageItems.length > 0 ? pageItems.map(item => {
                                    const stMap = {
                                        'in-progress': { label: 'Đang làm', color: '#0984e3', bg: 'rgba(9,132,227,0.1)' },
                                        'upcoming': { label: 'Sắp tới', color: '#6c5ce7', bg: 'rgba(108,92,231,0.1)' },
                                        'completed': { label: 'Hoàn thành', color: '#00b894', bg: 'rgba(0,184,148,0.1)' },
                                        'cancelled': { label: 'Đã hủy', color: '#d63031', bg: 'rgba(214,48,49,0.1)' }
                                    };
                                    const st = stMap[item.category] || stMap.upcoming;
                                    
                                    return `
                                        <tr style="border-bottom: 1px solid var(--border-color); transition: 0.2s;">
                                            <td style="padding: 18px;">
                                                <div style="display: flex; flex-direction: column;">
                                                    <span style="font-weight: 700; color: var(--text-main); font-size: 0.95rem;">${item.title}</span>
                                                    <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 4px;">${item.itemType === 'plan' ? 'Kế hoạch' : 'Nhiệm vụ'} • ${item.priority || 'Medium'}</small>
                                                </div>
                                            </td>
                                            <td style="padding: 18px; color: var(--text-muted); font-size: 0.85rem;">
                                                ${item.date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                            </td>
                                            <td style="padding: 18px; text-align: center;">
                                                <span style="padding: 4px 12px; border-radius: 30px; font-size: 0.75rem; font-weight: 800; color: ${st.color}; background: ${st.bg}; border: 1px solid ${st.color}22;">
                                                    ${st.label}
                                                </span>
                                            </td>
                                            <td style="padding: 18px; text-align: center; color: var(--text-muted); font-size: 1.1rem;">
                                                <div style="display: flex; gap: 15px; justify-content: center;">
                                                    <i class="far fa-eye action-icon" title="Xem chi tiết" style="cursor: pointer;"></i>
                                                    ${item.category !== 'completed' ? `<i class="far fa-check-circle action-icon" title="Hoàn thành" style="color: #00b894; cursor: pointer;"></i>` : ''}
                                                    <i class="far fa-trash-alt action-icon delete-btn" data-id="${item.id}" data-type="${item.itemType}" title="Xóa" style="color: var(--danger); cursor: pointer;"></i>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('') : `<tr><td colspan="4" style="padding: 80px; text-align: center; color: var(--text-muted);">Không tìm thấy thông tin nào phù hợp.</td></tr>`}
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding: 0 10px;">
                        <small style="color: var(--text-muted); font-weight: 600;">Trang ${currentPage} / ${totalPages}</small>
                        <div style="display: flex; gap: 10px;">
                            <button class="page-btn" data-dir="prev" ${currentPage <= 1 ? 'disabled' : ''} style="padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: white; cursor: pointer; opacity: ${currentPage <= 1 ? 0.4 : 1};"><i class="fas fa-chevron-left"></i></button>
                            <button class="page-btn" data-dir="next" ${currentPage >= totalPages ? 'disabled' : ''} style="padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 8px; background: white; cursor: pointer; opacity: ${currentPage >= totalPages ? 0.4 : 1};"><i class="fas fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                <!-- Detail Modal -->
                <div id="task-detail-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10000; align-items: center; justify-content: center; backdrop-filter: blur(4px);">
                    <div style="background: white; width: 450px; border-radius: 20px; overflow: hidden; animation: modalIn 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);">
                        <div id="modal-header" style="padding: 20px; background: var(--primary-color); color: white; display: flex; justify-content: space-between; align-items: center;">
                            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800;">Chi tiết nhiệm vụ</h3>
                            <i class="fas fa-times" id="close-modal" style="cursor: pointer; font-size: 1.2rem;"></i>
                        </div>
                        <div id="modal-body" style="padding: 24px;">
                            <!-- Dynamic Content -->
                        </div>
                        <div style="padding: 16px 24px; background: #f8f9fa; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end;">
                            <button id="close-modal-btn" style="padding: 8px 18px; border-radius: 10px; border: 1.5px solid var(--border-color); background: white; font-weight: 700; cursor: pointer;">Đóng lại</button>
                        </div>
                    </div>
                </div>

                <style>
                    @keyframes modalIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .action-icon { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
                    .action-icon:hover { transform: scale(1.25); filter: contrast(1.5); }
                </style>
            `;

            // Listeners
            container.querySelectorAll('.filter-tab-btn').forEach(btn => {
                btn.onclick = () => { currentTab = btn.dataset.tab; currentPage = 1; renderTable(); };
            });

            container.querySelectorAll('.page-btn').forEach(btn => {
                btn.onclick = () => {
                    if (btn.dataset.dir === 'prev' && currentPage > 1) currentPage--;
                    if (btn.dataset.dir === 'next' && currentPage < totalPages) currentPage++;
                    renderTable();
                };
            });

            container.querySelectorAll('.fa-eye').forEach((icon, i) => {
                icon.onclick = () => {
                    const item = pageItems[i];
                    const modal = document.getElementById('task-detail-modal');
                    const body = document.getElementById('modal-body');
                    body.innerHTML = `
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.75rem; font-weight: 900; color: var(--primary-color); text-transform: uppercase; margin-bottom: 8px;">Tiêu đề</div>
                            <div style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">${item.title}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                            <div>
                                <div style="font-size: 0.7rem; font-weight: 900; color: #b2bec3; text-transform: uppercase;">Phân loại</div>
                                <div style="font-weight: 700;">${item.itemType === 'plan' ? 'Kế hoạch' : 'Nhiệm vụ'}</div>
                            </div>
                            <div>
                                <div style="font-size: 0.7rem; font-weight: 900; color: #b2bec3; text-transform: uppercase;">Ưu tiên</div>
                                <div style="font-weight: 700;">${(item.priority || 'Medium').toUpperCase()}</div>
                            </div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <div style="font-size: 0.7rem; font-weight: 900; color: #b2bec3; text-transform: uppercase;">Thời hạn / Diễn ra</div>
                            <div style="font-weight: 700; color: var(--text-muted);"><i class="far fa-clock"></i> ${item.date.toLocaleString('vi-VN')}</div>
                        </div>
                        <div>
                            <div style="font-size: 0.7rem; font-weight: 900; color: #b2bec3; text-transform: uppercase;">Ghi chú chi tiết</div>
                            <div style="font-size: 0.95rem; color: var(--text-main); margin-top: 5px; line-height: 1.6; background: #fdfdfe; padding: 12px; border-radius: 10px; border: 1px dashed #dfe6e9;">${item.description || 'Không có mô tả nào cho mục này.'}</div>
                        </div>
                    `;
                    modal.style.display = 'flex';
                };
            });

            document.getElementById('close-modal').onclick = () => document.getElementById('task-detail-modal').style.display = 'none';
            document.getElementById('close-modal-btn').onclick = () => document.getElementById('task-detail-modal').style.display = 'none';

            container.querySelectorAll('.fa-check-circle').forEach((icon, i) => {
                icon.onclick = async () => {
                    const item = pageItems[i];
                    if (confirm('Đánh dấu mục này là "Hoàn thành"?')) {
                        try {
                            const endpoint = item.itemType === 'plan' ? `/plans/update/${item.id}` : `/tasks/update/${item.id}`;
                            await api.put(endpoint, { ...item, status: 'completed' });
                            renderTasks(container);
                        } catch (err) { alert('Lỗi: ' + err.message); }
                    }
                };
            });

            container.querySelectorAll('.delete-btn').forEach(btn => {
                btn.onclick = async () => {
                    if (confirm('Bạn thực sự muốn xóa mục này?')) {
                        try {
                            const endpoint = btn.dataset.type === 'plan' ? `/plans/delete/${btn.dataset.id}` : `/tasks/delete/${btn.dataset.id}`;
                            await api.delete(endpoint);
                            renderTasks(container);
                        } catch (err) { alert(err.message); }
                    }
                };
            });
        };

        renderTable();

    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger); font-weight: 700;">Hệ thống gặp lỗi: ${error.message}</div>`;
    }
};
