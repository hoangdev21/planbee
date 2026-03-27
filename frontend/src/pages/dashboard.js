import api from '../utils/api.js';

export const renderDashboard = async (container) => {
    container.innerHTML = `<div style="padding: 40px; text-align: center;">Đang tổng hợp thông tin...</div>`;
    
    try {
        const response = await api.get('/dashboard/overview');
        const { stats, todayPlans, habits, productivity } = response;

        container.innerHTML = `
            <div class="dashboard-root fade-in" style="display: flex; flex-direction: column; gap: 32px;">
                <!-- Hero Section: Welcome -->
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-size: 1.75rem; font-weight: 800; color: var(--text-main);">Chào mừng bạn trở lại! 🐝</h2>
                        <p style="color: var(--text-muted); font-size: 1rem;">Hôm nay là ${new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;">
                    ${renderStatCard('Tổng công việc', stats.total || 0, '/sum.png', 'var(--primary-color)')}
                    ${renderStatCard('Hoàn thành', stats.completed || 0, '/complete.png', 'var(--success)')}
                    ${renderStatCard('Đang thực hiện', stats.doing || 0, '/proceed.png', 'var(--info)')}
                    ${renderStatCard('Quá hạn', stats.overdue || 0, '/ban.png', 'var(--danger)')}
                </div>

                <!-- Today's Schedule - Redesigned to Horizontal Scroll Cards -->
                <div style="background: var(--card-bg); border-radius: 28px; border: 1.5px solid var(--border-color); padding: 32px; box-shadow: var(--shadow-md); position: relative; overflow: hidden;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                        <h3 style="font-size: 1.35rem; font-weight: 800; display: flex; align-items: center; gap: 12px;">
                            <i class="fas fa-calendar-alt" style="color: var(--primary-color);"></i>
                            Lịch trình hôm nay
                        </h3>
                        <a href="#/planning" style="font-size: 0.88rem; color: var(--primary-color); font-weight: 800; text-decoration: none; display: flex; align-items: center; gap: 6px;">
                            XEM CHI TIẾT <i class="fas fa-arrow-right" style="font-size: 0.75rem;"></i>
                        </a>
                    </div>
                    
                    <div class="today-schedule-container" style="display: flex; gap: 20px; overflow-x: auto; padding: 10px 4px 20px 4px; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none;">
                        ${todayPlans.length > 0 ? todayPlans.map(plan => {
                            const startTime = new Date(plan.start_time);
                            const endTime = new Date(plan.end_time);
                            const isDone = plan.status === 'completed';
                            
                            return `
                                 <div class="schedule-card ${isDone ? 'done' : ''}" style="flex: 0 0 calc(100% / 6 - 20px); min-width: 180px; scroll-snap-align: start; background: var(--card-bg); border-radius: 20px; padding: 20px; border: 1.5px solid var(--border-color); box-shadow: var(--shadow-sm); transition: all 0.3s ease; display: flex; flex-direction: column; gap: 12px; position: relative; overflow: hidden; cursor: pointer;">
                                     <!-- Simple colored indicator dot -->
                                     <div style="width: 8px; height: 8px; border-radius: 50%; background: ${isDone ? 'var(--success)' : plan.color}; margin-bottom: 4px;"></div>
                                     
                                     <div style="display: flex; flex-direction: column; gap: 4px;">
                                         <div style="font-size: 0.7rem; font-weight: 800; color: var(--text-muted); display: flex; align-items: center; gap: 5px;">
                                             <i class="far fa-clock" style="font-size: 0.65rem;"></i>
                                             ${startTime.getHours()}:${startTime.getMinutes().toString().padStart(2,'0')} - ${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2,'0')}
                                         </div>
                                         <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-main); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${plan.title}</div>
                                     </div>
                                     
                                     <div style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                         ${plan.description || 'Không có mô tả cho lịch này.'}
                                     </div>
                                     
                                     <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                                         <span style="font-size: 0.65rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; background: ${plan.color}15; color: ${plan.color}; text-transform: uppercase;">${plan.priority || 'MEDIUM'}</span>
                                         ${isDone ? '<i class="fas fa-check-circle" style="color: var(--success); font-size: 1rem;"></i>' : ''}
                                     </div>
                                 </div>
                             `;
                         }).join('') : `
                             <div style="flex: 1; text-align: center; padding: 60px 40px; color: var(--text-light); border: 2px dashed var(--border-color); border-radius: 24px;">
                                 <div style="width: 70px; height: 70px; border-radius: 50%; background: var(--primary-light); color: var(--primary-color); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 1.8rem;">
                                     <i class="fas fa-calendar-check"></i>
                                 </div>
                                 <h4 style="font-weight: 800; color: var(--text-main); margin-bottom: 8px;">Mọi thứ đã sẵn sàng!</h4>
                                 <p style="font-size: 0.9rem;">Không có kế hoạch nào trong hôm nay.</p>
                             </div>
                         `}
                     </div>
                 </div>
 
                 <!-- Main Content Row: habits -->
                 <div style="display: grid; grid-template-columns: 1fr; gap: 32px;">
                     <!-- Habit Streaks -->
                     <div style="background: var(--card-bg); border-radius: 28px; border: 1.5px solid var(--border-color); padding: 32px; box-shadow: var(--shadow-md);">
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;">
                             <h3 style="font-size: 1.35rem; font-weight: 800; display: flex; align-items: center; gap: 12px;">
                                 <i class="fas fa-seedling" style="color: var(--success);"></i>
                                 Thói quen hàng ngày
                             </h3>
                             <a href="#/habits" style="font-size: 0.88rem; color: var(--primary-color); font-weight: 800; text-decoration: none;">TẤT CẢ <i class="fas fa-arrow-right"></i></a>
                         </div>
                         
                         <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
                             ${habits.length > 0 ? habits.slice(0, 6).map(habit => {
                                 const isDone = habit.last_completed && habit.last_completed.startsWith(new Date().toISOString().slice(0, 10));
                                 return `
                                     <div style="display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 20px; background: ${isDone ? 'rgba(0, 184, 148, 0.08)' : 'var(--bg-color)'}; border: 1.5px solid var(--border-color); box-shadow: var(--shadow-sm); transition: transform 0.2s;">
                                         <div style="width: 48px; height: 48px; border-radius: 14px; background: ${isDone ? 'var(--success)' : 'var(--card-bg)'}; color: ${isDone ? 'white' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; transition: all 0.3s; border: 1px solid var(--border-color);">
                                             <i class="fas ${isDone ? 'fa-check' : 'fa-fire'}"></i>
                                         </div>
                                         <div style="flex: 1;">
                                             <div style="font-weight: 800; font-size: 1rem; color: ${isDone ? 'var(--success)' : 'var(--text-main)'}; margin-bottom: 4px;">${habit.title}</div>
                                             <div style="display:flex; align-items:center; gap:8px;">
                                                 <div style="height: 6px; background: var(--border-color); flex: 1; border-radius: 10px; overflow: hidden;">
                                                     <div style="width: ${Math.min(habit.current_streak * 10, 100)}%; height: 100%; background: var(--success); border-radius: 10px;"></div>
                                                 </div>
                                                 <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); white-space: nowrap;">${habit.current_streak} ngày 🔥</span>
                                             </div>
                                         </div>
                                     </div>
                                 `;
                             }).join('') : `<p style="text-align: center; color: var(--text-light); grid-column: 1/-1; padding: 40px; border: 2px dashed var(--border-color); border-radius: 20px;">Bắt đầu xây dựng kỷ luật ngay hôm nay!</p>`}
                         </div>
                     </div>
                 </div>

                <!-- Bottom Row: Productivity Chart (Stat representation) -->
                <div style="background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border-color); padding: 28px; box-shadow: var(--shadow-sm);">
                    <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 24px;">Năng suất 7 ngày qua</h3>
                    <div style="display: flex; align-items: flex-end; gap: 12px; height: 150px; padding-bottom: 20px; border-bottom: 1px solid var(--border-color);">
                        ${Array(7).fill(0).map((_, i) => {
                            const date = new Date(); date.setDate(date.getDate() - (6 - i));
                            const dateStr = date.toISOString().slice(0, 10);
                            const dayData = productivity.find(p => p.date.startsWith(dateStr));
                            const height = dayData ? (dayData.count * 20) : 5;
                            return `
                                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                                    <div style="width: 100%; max-width: 40px; height: ${height}px; background: var(--primary-color); border-radius: 4px 4px 0 0; transition: height 0.5s ease;"></div>
                                    <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-muted);">${date.getDate()} Th ${date.getMonth()+1}</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                <style>
                    .today-schedule-container::-webkit-scrollbar { display: none; }
                    .schedule-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.08); border-color: rgba(255, 167, 38, 0.4); }
                    .schedule-card.done { opacity: 0.6; filter: grayscale(0.5); }
                </style>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Lỗi: ${error.message}</div>`;
    }
};

const renderStatCard = (label, value, icon, color) => {
    // Ensure no leading zeros by converting to Number
    const displayValue = !isNaN(value) ? Number(value) : value;
    
    return `
    <div style="background: var(--card-bg); border-radius: 16px; padding: 24px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm);">
        <div style="width: 60px; height: 60px; border-radius: 16px; background: rgba(0,0,0,0.04); display: flex; align-items: center; justify-content: center; border: 2px solid ${color}; box-shadow: 0 8px 20px rgba(0,0,0,0.08);">
            <img src="${icon}" alt="${label} icon" style="width: 32px; height: 32px; object-fit: contain;" />
        </div>
        <div style="flex: 1;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">${label}</div>
            <div style="font-size: 1.85rem; font-weight: 900; color: var(--text-main); letter-spacing: 0.02em;">${displayValue}</div>
        </div>
    </div>
    `;
};
