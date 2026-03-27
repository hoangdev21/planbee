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
                    ${renderStatCard('Tổng công việc', stats.total || 0, 'fa-tasks', 'var(--primary-color)')}
                    ${renderStatCard('Hoàn thành', stats.completed || 0, 'fa-check-circle', 'var(--success)')}
                    ${renderStatCard('Đang thực hiện', stats.doing || 0, 'fa-spinner', 'var(--info)')}
                    ${renderStatCard('Quá hạn', stats.overdue || 0, 'fa-exclamation-triangle', 'var(--danger)')}
                </div>

                <!-- Main Content Row -->
                <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 32px;">
                    <!-- Left: Today's Schedule -->
                    <div style="background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border-color); padding: 28px; box-shadow: var(--shadow-sm);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="font-size: 1.25rem; font-weight: 800;">Lịch trình hôm nay</h3>
                            <a href="#/planning" style="font-size: 0.85rem; color: var(--primary-color); font-weight: 700;">Xem chi tiết <i class="fas fa-arrow-right"></i></a>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            ${todayPlans.length > 0 ? todayPlans.map(plan => `
                                <div style="display: flex; gap: 20px; align-items: center; padding: 16px; border-radius: 12px; background: var(--input-bg); border-left: 6px solid ${plan.color};">
                                    <div style="font-weight: 800; font-size: 0.85rem; color: var(--text-muted); width: 80px;">
                                        ${new Date(plan.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div style="flex: 1;">
                                        <div style="font-weight: 700; color: var(--text-main);">${plan.title}</div>
                                        <div style="font-size: 0.75rem; color: var(--text-muted);">${plan.description || 'Không có mô tả'}</div>
                                    </div>
                                </div>
                            `).join('') : `
                                <div style="text-align: center; padding: 40px; color: var(--text-light);">
                                    <i class="fas fa-calendar-day" style="font-size: 2rem; margin-bottom: 12px; opacity: 0.3;"></i>
                                    <p>Không có kế hoạch nào cho hôm nay.</p>
                                </div>
                            `}
                        </div>
                    </div>

                    <!-- Right: Habit Streaks -->
                    <div style="background: var(--card-bg); border-radius: 20px; border: 1px solid var(--border-color); padding: 28px; box-shadow: var(--shadow-sm);">
                         <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                            <h3 style="font-size: 1.25rem; font-weight: 800;">Thói quen</h3>
                            <a href="#/habits" style="font-size: 0.85rem; color: var(--primary-color); font-weight: 700;">Tất cả <i class="fas fa-arrow-right"></i></a>
                        </div>
                        
                        <div style="display: flex; flex-direction: column; gap: 24px;">
                            ${habits.length > 0 ? habits.slice(0, 5).map(habit => {
                                const isDone = habit.last_completed && habit.last_completed.startsWith(new Date().toISOString().slice(0, 10));
                                return `
                                    <div style="display: flex; align-items: center; gap: 16px;">
                                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${isDone ? 'var(--success)' : 'rgba(0,0,0,0.05)'}; color: ${isDone ? 'white' : 'var(--text-muted)'}; display: flex; align-items: center; justify-content: center;">
                                            <i class="fas ${isDone ? 'fa-check' : 'fa-fire'}"></i>
                                        </div>
                                        <div style="flex: 1;">
                                            <div style="font-weight: 700; font-size: 0.95rem;">${habit.title}</div>
                                            <div style="font-size: 0.75rem; color: var(--text-muted);">${habit.current_streak} ngày liên tiếp</div>
                                        </div>
                                    </div>
                                `;
                            }).join('') : `<p style="text-align: center; color: var(--text-light);">Bắt đầu thói quen mới ngay!</p>`}
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
                </div>
            </div>
        `;
    } catch (error) {
        container.innerHTML = `<div style="padding: 40px; text-align: center; color: var(--danger);">Lỗi: ${error.message}</div>`;
    }
};

const renderStatCard = (label, value, icon, color) => `
    <div style="background: var(--card-bg); border-radius: 16px; padding: 24px; border: 1px solid var(--border-color); display: flex; align-items: center; gap: 20px; box-shadow: var(--shadow-sm);">
        <div style="width: 52px; height: 52px; border-radius: 12px; background: rgba(0,0,0,0.03); color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
            <i class="fas ${icon}"></i>
        </div>
        <div>
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 4px;">${label}</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${value}</div>
        </div>
    </div>
`;
