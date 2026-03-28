import api from '../utils/api.js';
import { formatDateToYYYYMMDD, formatDateTimeToLocal } from '../utils/dateFormatter.js';

let currentDate = new Date();
let currentView = 'day'; // 'day', 'week', 'month'
let editingItem = null;
let modalTab = 'view'; // 'view' or 'edit'

const PRESET_COLORS = [
    '#FFA726', '#66BB6A', '#29B6F6', '#AB47BC', '#EF5350', 
    '#FFEE58', '#78909C', '#F06292', '#26A69A', '#3F51B5', '#D4E157'
];

export const renderPlanning = async (container, params = {}) => {
    container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--text-muted); font-size: 1.1rem; font-weight: 600;">Đang tải lịch trình...</div>`;
    
    // Handle params for deep linking
    if (params.view) currentView = params.view;
    if (params.date) currentDate = new Date(params.date);
    
    try {
        const [tasksRes, habitsRes, plansRes] = await Promise.all([
            api.get('/tasks/all'), api.get('/habits/all'), api.get('/plans/all')
        ]);
        
        let finalTasks = tasksRes.tasks;
        let finalPlans = plansRes.plans;

        // GHOST ITEM LOGIC: If we are here for a deletion effect but item is gone from DB
        if (params.isDelete === 'true' && params.id) {
            const existsInPlans = finalPlans.some(p => p.id == params.id);
            const existsInTasks = finalTasks.some(t => t.id == params.id);
            
            if (!existsInPlans && !existsInTasks) {
                // Create a ghost plan or task based on tags
                if (params.tag === 'delete_plan' || params.start_time) {
                    finalPlans.push({
                        id: params.id,
                        title: params.title || 'Đang xóa...',
                        start_time: params.start_time || `${params.date} ${params.time || '12:00:00'}`,
                        end_time: params.end_time || `${params.date} ${params.time ? parseInt(params.time)+1 : '13'}:00:00`,
                        color: params.color || '#FF5252',
                        status: 'pending',
                        isGhost: true
                    });
                }
            }
        }

        renderPlanningUI(container, finalTasks, habitsRes.habits, finalPlans, params);
    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Lỗi hệ thống: ${error.message}</div>`;
    }
};

const getPlanType = (p) => {
    const start = new Date(p.start_time), end = new Date(p.end_time);
    const diffHours = (end - start) / (1000 * 60 * 60);
    const diffDays = (new Date(end.toDateString()) - new Date(start.toDateString())) / (1000 * 60 * 60 * 24);
    if (diffHours >= 24 || diffDays > 0) return 'all-day';
    return 'hourly';
};

const renderPlanningUI = (container, tasks, habits, plans, params = {}) => {
    container.innerHTML = `
        <div class="planning-root fade-in" style="display: flex; flex-direction: column; gap: 20px;">
            <div style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 2px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 24px;">
                    <h2 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main);">Lập kế hoạch</h2>
                    <div class="view-selector" style="display: flex; background: var(--input-bg); padding: 5px; border-radius: 12px; border: 1.5px solid var(--border-color);">
                        <button class="view-btn ${currentView === 'day' ? 'active' : ''}" data-view="day">Ngày</button>
                        <button class="view-btn ${currentView === 'week' ? 'active' : ''}" data-view="week">Tuần</button>
                        <button class="view-btn ${currentView === 'month' ? 'active' : ''}" data-view="month">Tháng</button>
                    </div>
                </div>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <button id="add-plan-btn" class="btn btn-primary" style="padding: 12px 24px; font-weight: 800; border-radius: 10px;">
                        <i class="fas fa-plus"></i> Thêm kế hoạch
                    </button>
                    <div style="width: 1px; height: 30px; background: var(--border-color); margin: 0 8px;"></div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button id="prev-btn" class="btn btn-outline" style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius: 10px;"><i class="fas fa-chevron-left"></i></button>
                        <span style="font-size: 1.1rem; font-weight: 800; min-width: 200px; text-align: center; color: var(--text-main);">${getFormattedDateLabel()}</span>
                        <button id="next-btn" class="btn btn-outline" style="width:40px; height:40px; display:flex; align-items:center; justify-content:center; border-radius: 10px;"><i class="fas fa-chevron-right"></i></button>
                    </div>
                    <button id="today-btn" class="btn btn-outline" style="padding: 10px 20px; font-size: 0.9rem; font-weight: 800; border-radius: 10px;">Hôm nay</button>
                </div>
            </div>

            ${renderOverdueBanner(tasks)}

            <div id="calendar-view-container" style="background: var(--card-bg); border-radius: 20px; border: 1.5px solid var(--border-color); height: calc(125vh - 320px); overflow: hidden; position: relative;">
                ${renderCurrentView(tasks, habits, plans)}
            </div>

            <div id="plan-modal" class="modal-overlay" style="display: none;">
                <div class="modal-content" style="max-width: 750px; min-height: 550px; border-radius: 28px; padding: 0; overflow: hidden; box-shadow: var(--shadow-lg); display: flex; flex-direction: column;">
                    <div id="modal-tabs" style="display: flex; background: var(--sidebar-bg); border-bottom: 2px solid var(--border-color);">
                        <div class="modal-tab-btn active" data-tab="view" style="flex:1; padding:20px; text-align:center; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:12px; font-size:1rem;">
                            <i class="fas fa-info-circle"></i> Thông tin
                        </div>
                        <div class="modal-tab-btn" data-tab="edit" style="flex:1; padding:20px; text-align:center; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:12px; font-size:1rem;">
                            <i class="fas fa-edit"></i> Chỉnh sửa
                        </div>
                        <button id="close-modal" style="padding:10px 22px; border:none; background:none; cursor:pointer; font-size:1.1rem;"><i class="fas fa-times"></i></button>
                    </div>
                    <div id="modal-body-container" style="padding: 28px;"></div>
                </div>
            </div>
        </div>
        <style>
            .view-btn { padding: 8px 18px; border-radius: 10px; font-size: 0.9rem; font-weight: 700; color: var(--text-muted); cursor: pointer; border: none; background: none; }
            .view-btn.active { background: var(--card-bg); color: var(--primary-color); box-shadow: var(--shadow-sm); }
            .modal-tab-btn.active { background: var(--card-bg); color: var(--primary-color); border-bottom: 3.5px solid var(--primary-color); }
            
            /* Sharp design for info blocks but with rounded corners inside modal */
            .info-row { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 12px; padding: 16px; border-radius: 14px; background: var(--input-bg); border-left: none; }
            .info-icon { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 1.1rem; flex-shrink: 0; background: none; box-shadow: none; }
            .info-label { font-size: 0.72rem; font-weight: 900; opacity: 0.5; text-transform: uppercase; margin-bottom: 4px; }
            .info-value { font-size: 0.88rem; font-weight: 700; color: var(--text-main); line-height: 1.5; }
            
            .allday-pill { padding: 4px 14px; width: fit-content; border-radius: 20px; font-size: 0.75rem; font-weight: 900; color: white; cursor: pointer; border: 1px solid rgba(255,255,255,0.2); margin: 0; display: flex; align-items: center; gap: 6px; }
            .allday-pill.done { opacity: 0.6; filter: grayscale(0.2); text-decoration: line-through; }
            
            .plan-event { position: absolute; border-left: 4.5px solid rgba(0,0,0,0.15); border-radius: 12px; padding: 8px 12px; color: white; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; cursor: pointer; }
            .plan-event:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.15); }
            .plan-event.done { opacity: 0.6; filter: grayscale(0.2); }
            .plan-event.done::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.1) 55%, transparent 55%); background-size: 8px 8px; pointer-events: none; }
            
            .month-day-cell { border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); min-height: 110px; padding: 10px; cursor: pointer; transition: 0.2s; position: relative; }
            .month-day-cell:hover { background: rgba(0,0,0,0.012); }
            .month-day-number { font-weight: 800; font-size: 0.95rem; color: var(--text-muted); margin-bottom: 8px; display: block; }
            .month-day-number.today { color: var(--primary-color); font-weight: 900; }
            .month-event-badge { font-size: 0.72rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; color: white; margin-bottom: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-left: 3.5px solid rgba(0,0,0,0.15); width: 100%; display: flex; align-items: center; justify-content: space-between; }
            .month-event-badge.done { opacity: 0.6; text-decoration: line-through; }
            .task-pill.done { opacity: 0.5; text-decoration: line-through; filter: grayscale(1); }
            .task-pill.overdue { box-shadow: 0 2px 8px rgba(214,48,49,0.15); animation: pulse-danger 2s infinite; }
            @keyframes pulse-danger { 0% { box-shadow: 0 0 0 0 rgba(214,48,49,0.2); } 70% { box-shadow: 0 0 0 6px rgba(214,48,49,0); } 100% { box-shadow: 0 0 0 0 rgba(214,48,49,0); } }
        </style>
    `;

    const setupModal = (item, type, initialTab = 'view') => {
        editingItem = { item, type }; modalTab = initialTab;
        const tabsEl = document.getElementById('modal-tabs');
        const vTab = tabsEl.querySelector('[data-tab="view"]'), eTab = tabsEl.querySelector('[data-tab="edit"]');
        if (!item) { vTab.style.display = 'none'; modalTab = 'edit'; eTab.classList.add('active'); }
        else { vTab.style.display = 'flex'; tabsEl.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === modalTab)); }
        renderModalBody(item, type);
        document.getElementById('plan-modal').style.display = 'flex';
    };

    const renderModalBody = (item, type) => {
        const container = document.getElementById('modal-body-container');
        if (modalTab === 'view' && item) {
            container.innerHTML = `
                <div class="fade-in">
                    <h2 style="font-size:1.5rem; font-weight:900; margin-bottom:24px; color:var(--text-main); font-family:inherit;">${item.title}</h2>
                    <div class="info-row"><div class="info-icon"><i class="far fa-clock"></i></div><div><div class="info-label">KHOẢNG THỜI GIAN</div><div class="info-value">${type === 'plan' ? `${new Date(item.start_time).toLocaleString('vi-VN')} – ${new Date(item.end_time).toLocaleString('vi-VN')}` : `Hạn: ${new Date(item.due_date).toLocaleString()}`}</div></div></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                        <div class="info-row"><div class="info-icon" style="color:${item.priority==='high'?'var(--danger)':'var(--primary-color)'}"><i class="fas fa-flag"></i></div><div><div class="info-label">ƯU TIÊN</div><div class="info-value">${item.priority==='high'?'Quan trọng':'Thường'}</div></div></div>
                        <div class="info-row"><div class="info-icon" style="color:${item.color}"><i class="fas fa-palette"></i></div><div><div class="info-label">MÀU SẮC</div><div style="width:18px; height:18px; border-radius:4px; background:${item.color}; margin-top:2px;"></div></div></div>
                    </div>
                    <div class="info-row" style="align-items:flex-start;"><div class="info-icon"><i class="fas fa-align-left"></i></div><div style="flex:1;"><div class="info-label">MÔ TẢ CHI TIẾT</div><div class="info-value" style="font-weight:500; font-size:0.88rem;">${item.description || 'Chưa có mô tả thêm cho kế hoạch này.'}</div></div></div>
                    <div style="display:flex; justify-content:space-between; margin-top:24px; padding-top:20px; border-top:1.5px solid var(--border-color); align-items:center;">
                        <button id="delete-btn" style="color:var(--danger); font-weight:800; border:none; background:none; cursor:pointer; font-size:0.8rem; text-transform:uppercase;"><i class="fas fa-trash-alt"></i> Xóa lịch</button>
                        <div style="display:flex; gap:12px;">
                            ${item.status !== 'completed' ? `<button id="complete-btn" class="btn btn-primary" style="padding:10px 30px; border-radius:12px; font-weight:800; font-size:0.85rem; background: #4CAF50;">Hoàn Thành</button>` : `<span style="color:#4CAF50; font-weight:800; font-size:0.9rem;"><i class="fas fa-check-circle"></i> ĐÃ HOÀN THÀNH</span>`}
                            <button id="close-modal-btn" class="btn btn-outline" style="padding:10px 20px; border-radius:12px; font-weight:800; font-size:0.85rem;">ĐÓNG</button>
                        </div>
                    </div>
                </div>
            `;
            document.getElementById('delete-btn').onclick = async () => { if(confirm('Xóa?')){ await api.delete(type==='plan'?`/plans/delete/${item.id}`:`/tasks/delete/${item.id}`); document.getElementById('plan-modal').style.display='none'; renderPlanning(window.planningContainer); }};
            if(document.getElementById('complete-btn')) {
                document.getElementById('complete-btn').onclick = async () => {
                   try {
                       if (type === 'plan') {
                           await api.put(`/plans/update/${item.id}`, { ...item, status: 'completed' });
                       } else {
                           await api.put(`/tasks/update/${item.id}`, { ...item, status: 'completed' });
                       }
                       document.getElementById('plan-modal').style.display='none';
                       renderPlanning(window.planningContainer);
                   } catch(err) { alert('Lỗi: ' + (err.response?.data?.message || err.message)); }
                };
            }
            document.getElementById('close-modal-btn').onclick = () => document.getElementById('plan-modal').style.display='none';
        } else {
             container.innerHTML = `
                <form id="plan-form" class="fade-in">
                    <div class="form-group" style="margin-bottom:20px;"><label style="font-weight:700; display:block; margin-bottom:8px; font-size:0.9rem;">Tiêu đề kế hoạch</label><input type="text" name="title" value="${item?item.title:''}" required style="width:100%; padding:14px; border-radius:12px; border:1.5px solid var(--border-color); font-weight:700;"></div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div class="form-group"><label style="font-weight:700; font-size:0.9rem;">Bắt đầu</label><input type="datetime-local" name="start_time" value="${item?item.start_time.slice(0,16):''}" required style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color);"></div>
                        <div class="form-group"><label style="font-weight:700; font-size:0.9rem;">Kết thúc</label><input type="datetime-local" name="end_time" value="${item?item.end_time.slice(0,16):''}" required style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color);"></div>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div class="form-group"><label style="font-weight:700; font-size:0.9rem;">Mức độ</label><select name="priority" style="width:100%; padding:12px; border-radius:10px; border:1px solid var(--border-color);"><option value="low" ${item?.priority==='low'?'selected':''}>Thấp</option><option value="medium" ${item?.priority==='medium'||!item?'selected':''}>Trung bình</option><option value="high" ${item?.priority==='high'?'selected':''}>Quan trọng</option></select></div>
                        <div class="form-group"><label style="font-weight:700; font-size:0.9rem;">Màu nền</label><div style="display:flex; gap:8px; flex-wrap:wrap;">${PRESET_COLORS.map(c=>`<div class="color-circle ${item?.color===c?'active':''}" data-color="${c}" style="width:22px; height:22px; border-radius:50%; background:${c}; cursor:pointer; border:2.5px solid transparent;"></div>`).join('')}</div><input type="hidden" name="color" id="selected-color" value="${item?.color||PRESET_COLORS[0]}"></div>
                    </div>
                    <textarea name="description" rows="3" placeholder="Ghi chú thêm..." style="width:100%; padding:12px; border-radius:10px; border:1.5px solid var(--border-color); margin-bottom:24px;">${item?.description||''}</textarea>
                    <div style="display:flex; justify-content:flex-end; gap:12px;"><button type="button" id="c-btn" class="btn btn-outline" style="padding:12px 24px; border-radius:10px;">Hủy bỏ</button><button type="submit" class="btn btn-primary" style="padding:12px 36px; border-radius:10px; font-weight:800;">Lưu thay đổi</button></div>
                </form>
            `;
            const f = document.getElementById('plan-form');
            container.querySelectorAll('.color-circle').forEach(c=>c.onclick=()=>{container.querySelectorAll('.color-circle').forEach(x=>x.classList.remove('active'));c.classList.add('active');document.getElementById('selected-color').value=c.dataset.color;});
            document.getElementById('c-btn').onclick=()=>item?(modalTab='view',renderModalBody(item,type)):(document.getElementById('plan-modal').style.display='none');
            f.onsubmit=async(e)=>{e.preventDefault(); await api.post('/plans/add',Object.fromEntries(new FormData(f).entries())); document.getElementById('plan-modal').style.display='none'; renderPlanning(window.planningContainer);};
        }
    };

    container.querySelectorAll('.view-btn').forEach(btn => {
        btn.onclick = () => { currentView = btn.dataset.view; renderPlanningUI(container, tasks, habits, plans); };
    });
    document.getElementById('modal-tabs').onclick = (e) => {
        const btn = e.target.closest('.modal-tab-btn');
        if (btn && !btn.classList.contains('active')) {
            modalTab = btn.dataset.tab; renderModalBody(editingItem?.item, editingItem?.type);
            document.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active');
        }
    };
    document.getElementById('add-plan-btn').onclick = () => setupModal(null, 'plan', 'edit');
    document.getElementById('close-modal').onclick = () => document.getElementById('plan-modal').style.display = 'none';

    container.addEventListener('click', (e) => {
        const el = e.target.closest('.plan-event, .task-event, .allday-pill, .month-event-badge');
        if (el) { e.stopPropagation(); const id = el.dataset.id, t = el.classList.contains('task-event') ? 'task' : 'plan'; const item = t === 'plan' ? plans.find(p => p.id == id) : tasks.find(x => x.id == id); if (item) setupModal(item, t, 'view'); }
    });

    document.getElementById('prev-btn').onclick = () => { changeDate(-1); renderPlanningUI(container, tasks, habits, plans); };
    document.getElementById('next-btn').onclick = () => { changeDate(1); renderPlanningUI(container, tasks, habits, plans); };
    document.getElementById('today-btn').onclick = () => { currentDate = new Date(); renderPlanningUI(container, tasks, habits, plans); };

    // AUTO-SCROLL LOGIC: Scroll to specific time or title
    if ((params.time || params.title) && !params.noScroll) {
        setTimeout(() => {
            const scrollContainer = container.querySelector('.calendar-grid-scroll');
            if (!scrollContainer) return;

            let targetY = 0;
            const targetEl = params.title ? 
                Array.from(container.querySelectorAll('.plan-event, .month-event-badge'))
                    .find(el => el.innerText.toLowerCase().includes(params.title.toLowerCase()) && el.offsetParent !== null) : null;

            if (targetEl) {
                // If we found the actual element, scroll to it
                targetY = targetEl.offsetTop - 100;
            } else if (params.time && currentView !== 'month') {
                // Fallback to time calculation
                const hour = parseInt(params.time.split(':')[0]);
                const rowH = currentView === 'week' ? 60 : 65;
                targetY = (hour * rowH) - 100;
            }

            if (targetY > 0) {
                scrollContainer.scroll({ top: targetY, behavior: 'smooth' });
            }
        }, 250);
    }

    window.planningContainer = container;
};

const getFormattedDateLabel = () => {
    if (currentView === 'month') return `Tháng ${currentDate.getMonth() + 1}, ${currentDate.getFullYear()}`;
    const s = getStartOfWeek(currentDate); const e = new Date(s); e.setDate(s.getDate() + 6);
    return currentView === 'day' ? currentDate.toLocaleDateString('vi-VN', { weekday: 'long', day:'numeric', month:'short' }) : `${s.getDate()} Th ${s.getMonth()+1} - ${e.getDate()} Th ${e.getMonth()+1}`;
};

const changeDate = (d) => { if (currentView === 'day') currentDate.setDate(currentDate.getDate() + d); else if (currentView === 'week') currentDate.setDate(currentDate.getDate() + d*7); else currentDate.setMonth(currentDate.getMonth() + d); };
const getStartOfWeek = (d) => { const date = new Date(d); const day = date.getDay(); const diff = date.getDate() - day + (day === 0 ? -6 : 1); return new Date(date.setDate(diff)); };

const renderOverdueBanner = (tasks) => {
    const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date());
    const c = overdue.length;
    if (c === 0) return '';
    
    // Show names of first 2 overdue tasks
    const names = overdue.slice(0, 2).map(t => t.title).join(', ');
    const more = c > 2 ? ` và ${c - 2} việc khác` : '';
    
    return `
        <div class="overdue-banner" style="background:rgba(214,48,49,0.06); padding:12px 20px; border-radius:12px; color:var(--danger); font-weight:800; font-size:0.88rem; margin-bottom:16px; border-left:4px solid var(--danger); display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:12px;">
                <i class="fas fa-exclamation-circle" style="font-size:1.1rem;"></i>
                <span>Bạn có ${c} việc quá hạn: <strong>${names}${more}</strong></span>
            </div>
            <button onclick="window.location.hash = '#tasks'" style="background:var(--danger); color:white; border:none; padding:6px 14px; border-radius:8px; font-size:0.75rem; font-weight:900; cursor:pointer; transition: 0.2s;" onmouseover="this.style.opacity=0.9" onmouseout="this.style.opacity=1">XEM TẤT CẢ</button>
        </div>
    `;
};

const renderCurrentView = (tasks, habits, plans) => {
    if (currentView === 'day') return renderDayView(tasks, habits, plans);
    if (currentView === 'week') return renderWeekView(tasks, habits, plans);
    return renderMonthView(tasks, habits, plans);
};

const renderDayView = (t, h, p) => {
    const ds = formatDateToYYYYMMDD(currentDate);
    const dayPlans = p.filter(x => ds >= formatDateToYYYYMMDD(x.start_time) && ds <= formatDateToYYYYMMDD(x.end_time));
    const dayTasks = t.filter(x => (x.due_date && x.due_date.startsWith(ds)) || (x.status !== 'completed' && x.due_date && new Date(x.due_date) < new Date()));
    const allday = dayPlans.filter(x => getPlanType(x) === 'all-day'), hourly = dayPlans.filter(x => getPlanType(x) === 'hourly');
    
    let html = `<div style="padding:16px 24px; border-bottom:2px solid var(--border-color); background:var(--sidebar-bg); display:flex; flex-direction:column; gap:12px;">
        <div style="display:flex; gap:10px; align-items:center;">
            <small style="font-weight:900; opacity:0.6;">THÓI QUEN:</small>
            ${h.map(x=>`<div class="habit-pill ${x.last_completed&&x.last_completed.startsWith(ds)?'done':'not-done'}">${x.title}</div>`).join('')}
        </div>
        ${dayTasks.length > 0 ? `
            <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
                <small style="font-weight:900; opacity:0.6;">NHIỆM VỤ:</small>
                ${dayTasks.map(x=>{
                    const isOverdue = new Date(x.due_date) < new Date() && x.status !== 'completed';
                    return `<div class="task-pill task-event ${x.status === 'completed' ? 'done' : ''} ${isOverdue ? 'overdue' : ''}" data-id="${x.id}" style="border-left: 3.5px solid ${isOverdue ? 'var(--danger)' : '#6c5ce7'}; background: ${isOverdue ? 'rgba(214,48,49,0.1)' : 'rgba(108,92,231,0.1)'}; color: ${isOverdue ? 'var(--danger)' : '#6c5ce7'}; display:flex; align-items:center; gap:6px; padding: 4px 12px; border-radius:20px; font-size: 0.75rem; font-weight: 800; cursor:pointer;">
                        ${x.status === 'completed' ? '<img src="/complete.png" style="width:14px; height:14px; object-fit:contain;">' : `<i class="fas ${isOverdue ? 'fa-clock' : 'fa-check-double'}" style="font-size:0.65rem;"></i>`} ${x.title} ${isOverdue ? '<span style="opacity:0.7; font-size:0.65rem;">(Quá hạn)</span>' : ''}
                    </div>`
                }).join('')}
            </div>
        ` : ''}
        ${allday.length > 0 ? `<div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;"><small style="font-weight:900; opacity:0.6;">DÀI NGÀY:</small>${allday.map(x=>{const done = x.status === 'completed'; return `<div class="allday-pill ${done?'done':''}" data-id="${x.id}" style="background:${x.color};">${done?'<img src="/complete.png" style="width:14px; height:14px; object-fit:contain; margin-right:4px;">':`<i class="fas fa-calendar-check" style="font-size:0.65rem; opacity:0.8; margin-right:4px;"></i>`} ${x.title}</div>`}).join('')}</div>` : ''}
    </div>`;
    const rowH = 65;
    let grid = Array(24).fill(0).map((_,h)=>`<div class="time-row" style="height:${rowH}px;"><div class="time-label">${h}:00</div><div class="time-slot" style="background:${h%2===0?'rgba(0,0,0,0.01)':'transparent'}"></div></div>`).join('');
    let items = hourly.map(x => {
        const s = new Date(x.start_time), e = new Date(x.end_time);
        
        // Calculate top offset
        const top = (s.getHours() * rowH) + (s.getMinutes() * (rowH / 60)) + 4;
        
        // Calculate height, but CLIP it to not exceed the 24h grid in the current Day View
        let durationMinutes = (e - s) / 60000;
        // If it starts today but ends tomorrow, clip duration to end of today (24:00)
        const dayEnd = new Date(s); dayEnd.setHours(23, 59, 59, 999);
        if (e > dayEnd) durationMinutes = (dayEnd - s) / 60000;
        
        const height = Math.max(durationMinutes * (rowH / 60) - 8, 40);
        
        const done = x.status === 'completed';
        return `<div class="plan-event ${done?'done':''}" data-id="${x.id}" style="top:${top}px; height:${height}px; background:${x.color}; width:280px; left:90px;"><div style="font-size: 0.72rem; font-weight: 900; opacity: 0.85; margin-bottom: 4px; display:flex; align-items:center; justify-content:space-between;"><section><i class="far fa-clock"></i> ${s.getHours()}:${s.getMinutes().toString().padStart(2,'0')} - ${e.getHours()}:${e.getMinutes().toString().padStart(2,'0')}</section>${done?'<img src="/complete.png" style="width:18px; height:18px; object-fit:contain;">':''}</div><div style="font-size:0.92rem; font-weight:900; line-height:1.2; margin-bottom:4px;">${x.title}</div><div style="font-size:0.75rem; font-weight:500; opacity:0.8; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${x.description || ''}</div></div>`;
    }).join('');
    return `<div class="calendar-grid-scroll" style="overflow-y:auto; height:100%">${html}<div style="position:relative; height:${24 * rowH}px;">${grid}${items}</div></div>`;
};

const renderWeekView = (t, h, p) => {
    const start = getStartOfWeek(currentDate), rowH = 60, weeklyAllDay = p.filter(x => getPlanType(x) === 'all-day');
    let header = `<div style="display:grid; grid-template-columns: 80px repeat(7, 1fr); border-bottom:1.5px solid var(--border-color); position:sticky; top:0; z-index:100; background:var(--card-bg);"><div style="border-right:1px solid var(--border-color)"></div>${['T2','T3','T4','T5','T6','T7','CN'].map((l,i)=>{const d=new Date(start); d.setDate(start.getDate()+i); const active=formatDateToYYYYMMDD(d)===formatDateToYYYYMMDD(new Date()); return `<div style="padding:10px; text-align:center; border-right:1px solid var(--border-color); ${active?'background:var(--primary-light); color:var(--primary-color);':''}"><small style="opacity:0.6; font-weight:800">${l}</small><div style="font-weight:900; font-size:1.1rem">${d.getDate()}</div></div>`;}).join('')}</div>`;
    let alldayS = `<div style="display:grid; grid-template-columns: 80px repeat(7, 1fr); border-bottom:2px solid var(--border-color); background:var(--sidebar-bg); min-height:48px; padding:8px 0;"><div style="border-right:1px solid var(--border-color); display:flex; align-items:center; justify-content:center;"><i class="fas fa-layer-group" style="opacity:0.3; font-size:0.9rem;"></i></div>${Array(7).fill(0).map((_,i)=>{
        const d = new Date(start); d.setDate(start.getDate()+i); const ds = formatDateToYYYYMMDD(d); 
        const dayA = weeklyAllDay.filter(x=>ds>=formatDateToYYYYMMDD(x.start_time)&&ds<=formatDateToYYYYMMDD(x.end_time));
        const dayT = t.filter(x => x.due_date && formatDateToYYYYMMDD(x.due_date) === ds);
        return `<div style="border-right:1px solid var(--border-color); padding:0 6px; display:flex; flex-direction:column; gap:4px;">
            ${dayT.map(x => `<div class="task-pill task-event ${x.status==='completed'?'done':''}" data-id="${x.id}" style="width:100%; font-size:0.6rem; padding:2px 6px; border-radius:4px; background:rgba(108,92,231,0.1); color:#6c5ce7; border-left:2.5px solid #6c5ce7; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${x.title}</div>`).join('')}
            ${dayA.map(x=>{const s=formatDateToYYYYMMDD(x.start_time)===ds, e=formatDateToYYYYMMDD(x.end_time)===ds; return `<div class="allday-pill" data-id="${x.id}" style="background:${x.color}; width:100%; font-size:0.65rem; border-radius:${s?'20px 0 0 20px':e?'0 20px 20px 0':'0'}; border-left:${s?'3px solid rgba(0,0,0,0.15)':'none'}; box-shadow:none;">${s?x.title:'&nbsp;'}</div>`;}).join('')}
        </div>`;
    }).join('')}</div>`;
    let grid = `<div class="calendar-grid-scroll" style="display:grid; grid-template-columns: 80px repeat(7, 1fr); overflow-y:auto; flex:1; position:relative; max-height:${24 * rowH}px;"><div>${Array(24).fill(0).map((_,h)=>`<div style="height:${rowH}px; border-bottom:1px solid var(--border-color); text-align:right; padding:12px; font-size:0.75rem; color:var(--text-muted); font-weight:800">${h}:00</div>`).join('')}</div>${Array(7).fill(0).map((_,i)=>{const ds=formatDateToYYYYMMDD(new Date(new Date(start).setDate(start.getDate()+i))); return `<div style="position:relative; border-right:1px solid var(--border-color);">${Array(24).fill(0).map(()=>`<div style="height:${rowH}px; border-bottom:1px solid var(--border-color)"></div>`).join('')}${p.filter(x=>getPlanType(x)==='hourly'&&formatDateToYYYYMMDD(x.start_time) === ds).map(x=>{const s=new Date(x.start_time),e=new Date(x.end_time); const top=(s.getHours()*rowH)+(s.getMinutes()*(rowH/60))+4; let dur=(e-s)/60000; const dE=new Date(s); dE.setHours(23,59,59,999); if(e>dE) dur=(dE-s)/60000; const height=Math.max(dur*(rowH/60)-8, 40),done=x.status==='completed'; return `<div class="plan-event ${done?'done':''}" data-id="${x.id}" style="top:${top}px; height:${height}px; width:calc(100% - 10px); left:5px; background:${x.color};"><div style="font-size: 0.72rem; font-weight: 900; opacity: 0.85; margin-bottom: 4px; display:flex; align-items:center; justify-content:space-between;"><section><i class="far fa-clock"></i> ${s.getHours()}:${s.getMinutes().toString().padStart(2,'0')} - ${e.getHours()}:${e.getMinutes().toString().padStart(2,'0')}</section>${done?'<img src="/complete.png" style="width:16px; height:16px; object-fit:contain;">':''}</div><div style="font-size:0.92rem; font-weight:900; line-height:1.2; margin-bottom:4px;">${x.title}</div><div style="font-size:0.75rem; font-weight:500; opacity:0.8; line-height:1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${x.description || ''}</div></div>`;}).join('')}</div>`;}).join('')}</div>`;
    return `<div style="height:100%; display:flex; flex-direction:column; overflow:hidden;">${header}${alldayS}${grid}</div>`;
};

const renderMonthView = (tasks, habits, plans) => {
    const s = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), end = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0);
    const startDay = s.getDay() === 0 ? 6 : s.getDay() - 1;
    let header = `<div style="display:grid; grid-template-columns:repeat(7, 1fr); background:var(--sidebar-bg); border-bottom:2px solid var(--border-color);">${['T2','T3','T4','T5','T6','T7','CN'].map(l=>(`<div style="padding:14px; text-align:center; font-size:0.85rem; font-weight:900; color:var(--text-muted)">${l}</div>`)).join('')}</div>`;
    let body = `<div style="display:grid; grid-template-columns:repeat(7, 1fr); height:100%; border-left:1px solid var(--border-color);">`;
    for(let i=0; i<startDay; i++) body += `<div style="border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); background:rgba(0,0,0,0.012); height: 110px;"></div>`;
    for(let d=1; d<=end.getDate(); d++) {
        const d_obj = new Date(currentDate.getFullYear(), currentDate.getMonth(), d);
        const ds = formatDateToYYYYMMDD(d_obj), active = ds === formatDateToYYYYMMDD(new Date());
        const dayP = plans.filter(p => ds >= formatDateToYYYYMMDD(p.start_time) && ds <= formatDateToYYYYMMDD(p.end_time));
        const dayT = tasks.filter(t => t.due_date && formatDateToYYYYMMDD(t.due_date) === ds);
        const allDayItems = [
            ...dayT.map(x => ({ ...x, displayType: 'task' })),
            ...dayP.map(x => ({ ...x, displayType: 'plan' }))
        ];
        body += `<div class="month-day-cell" data-date="${ds}"><span class="month-day-number ${active?'today':''}">${d}</span><div class="month-indicator-container">
            ${allDayItems.slice(0,3).map(item=>{ 
                const done=item.status==='completed'; 
                const icon = item.displayType === 'task' ? '<i class="fas fa-check-double" style="font-size:0.6rem;"></i> ' : '';
                const color = item.displayType === 'task' ? '#6c5ce7' : item.color;
                const bg = item.displayType === 'task' ? 'rgba(108,92,231,0.1)' : item.color;
                const textColor = item.displayType === 'task' ? '#6c5ce7' : 'white';
                const border = item.displayType === 'task' ? `1px solid ${color}44` : 'none';
                
                return `<div class="${item.displayType==='task'?'task-event':'month-event-badge'} ${done?'done':''}" data-id="${item.id}" style="background:${bg}; color:${textColor}; border:${border}; font-size: 0.72rem; font-weight: 800; padding: 4px 8px; border-radius: 6px; margin-bottom: 3px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; border-left: 3.5px solid ${item.displayType==='task'?color:'rgba(0,0,0,0.15)'}; width: 100%; display: flex; align-items: center; justify-content: space-between;">
                    <section style="overflow:hidden; text-overflow:ellipsis;">${icon}${item.title}</section>
                    ${done?' <img src="/complete.png" style="width:12px; height:12px; object-fit:contain;">':''}
                </div>`
            }).join('')}
            ${allDayItems.length>3?`<div style="font-size:0.65rem; font-weight:800; color:var(--text-light); text-align:center;">+ ${allDayItems.length-3} mục khác</div>`:''}</div></div>`;
    }
    const rem = (startDay + end.getDate()) % 7 === 0 ? 0 : 7 - ((startDay + end.getDate()) % 7);
    for(let i=0; i<rem; i++) body += `<div style="border-right: 1px solid var(--border-color); border-bottom: 1px solid var(--border-color); background:rgba(0,0,0,0.012); height: 110px;"></div>`;
    return `<div style="height:100%; display:flex; flex-direction:column;">${header}${body}</div></div>`;
};
window.renderPlanning = renderPlanning; window.currentDate = currentDate; window.currentView = currentView;
