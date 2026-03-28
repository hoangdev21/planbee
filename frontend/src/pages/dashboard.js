import api from '../utils/api.js';
import { formatDateToYYYYMMDD } from '../utils/dateFormatter.js';

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
                        <h3 style="font-size: 1.5rem; font-weight: 900; display: flex; align-items: center; gap: 16px; color: var(--text-main);">
                            <img src="/calendar-dashboard.png" alt="schedule" style="width: 38px; height: 38px; object-fit: contain;">
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
                            <h3 style="font-size: 1.5rem; font-weight: 900; display: flex; align-items: center; gap: 16px; color: var(--text-main);">
                                <img src="/tree.png" alt="habits" style="width: 38px; height: 38px; object-fit: contain;">
                                Thói quen hàng ngày
                            </h3>
                             <a href="#/habits" style="font-size: 0.88rem; color: var(--primary-color); font-weight: 800; text-decoration: none;">TẤT CẢ <i class="fas fa-arrow-right"></i></a>
                         </div>
                         
                         <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
                             ${habits.length > 0 ? habits.slice(0, 6).map(habit => {
                                 const isDone = habit.last_completed && habit.last_completed.startsWith(formatDateToYYYYMMDD(new Date()));
                                 return `
                                     <div style="display: flex; align-items: center; gap: 20px; padding: 20px; border-radius: 20px; background: ${isDone ? 'rgba(0, 184, 148, 0.08)' : 'var(--bg-color)'}; border: 1.5px solid var(--border-color); box-shadow: var(--shadow-sm); transition: transform 0.2s;">
                                         <div style="width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                             <img src="${isDone ? '/complete.png' : (habit.frequency === 'daily' ? '/lightning.png' : '/thunder.png')}" style="width: 40px; height: 40px; object-fit: contain; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));">
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
                <div style="background: var(--card-bg); border-radius: 20px; border: 1.5px solid var(--border-color); padding: 28px; box-shadow: var(--shadow-sm);">
                    <h3 style="font-size: 1.5rem; font-weight: 900; display: flex; align-items: center; gap: 16px; margin-bottom: 24px; color: var(--text-main);">
                        <img src="/increase.png" alt="productivity" style="width: 38px; height: 38px; object-fit: contain;">
                        Năng suất tuần này
                    </h3>
                    <div style="display: flex; align-items: flex-end; gap: 12px; height: 160px; padding-bottom: 30px; border-bottom: 1.5px solid var(--border-color); margin-top: 20px;">
                        ${(() => {
                            // Find the start of the week (Monday)
                            const now = new Date();
                            const day = now.getDay();
                            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                            const startOfThisWeek = new Date(now.setDate(diff));

                            return Array(7).fill(0).map((_, i) => {
                                const d = new Date(startOfThisWeek);
                                d.setDate(startOfThisWeek.getDate() + i);
                                
                                // Format Local Date to Compare: YYYY-MM-DD
                                const localDateMatch = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2,'0')}-${d.getDate().toString().padStart(2,'0')}`;
                                
                                const dayData = productivity.find(p => {
                                    const dbDateStr = typeof p.date === 'string' ? p.date : new Date(p.date).toLocaleDateString('en-CA'); // 'en-CA' gives YYYY-MM-DD
                                    return dbDateStr.startsWith(localDateMatch);
                                });

                                const count = dayData ? parseInt(dayData.count) : 0;
                                const height = count > 0 ? Math.min(count * 25, 120) : 6;
                                const isToday = d.toDateString() === new Date().toDateString();
                                
                                const days = ['CN','T2','T3','T4','T5','T6','T7'];
                                const label = i === now.getDay() - 1 ? 'Nay' : days[d.getDay()];

                                return `
                                    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative;" title="${count} mục đã hoàn thành ngày ${localDateMatch}">
                                        ${count > 0 ? `<div style="position: absolute; top: -25px; font-size: 0.8rem; font-weight: 900; color: var(--primary-color); animation: bounce-top 0.5s;">${count}</div>` : ''}
                                        <div style="width: 100%; max-width: 38px; height: ${height}px; background: ${count > 0 ? 'var(--primary-color)' : 'rgba(0,0,0,0.06)'}; border-radius: 8px 8px 3px 3px; transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275); box-shadow: ${count > 0 ? '0 5px 15px rgba(255,167,38,0.25)' : 'none'}; border: ${isToday ? '2px solid var(--primary-color)' : 'none'};"></div>
                                        <div style="display:flex; flex-direction:column; align-items:center;">
                                            <span style="font-size: 0.72rem; font-weight: 900; color: ${isToday ? 'var(--primary-color)' : 'var(--text-muted)'};">${label}</span>
                                            <span style="font-size: 0.65rem; font-weight: 700; color: var(--text-light);">${d.getDate()}/${d.getMonth()+1}</span>
                                        </div>
                                    </div>
                                `;
                            }).join('');
                        })()}
                    </div>
                </div>
                <style>
                    .today-schedule-container::-webkit-scrollbar { display: none; }
                    .schedule-card:hover { transform: translateY(-8px); box-shadow: 0 16px 32px rgba(0,0,0,0.08); border-color: rgba(255, 167, 38, 0.4); }
                    .schedule-card.done { opacity: 0.6; filter: grayscale(0.5); }
                    @keyframes bounce-top { 
                        0% { transform: translateY(10px); opacity: 0; }
                        100% { transform: translateY(0); opacity: 1; }
                    }
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
