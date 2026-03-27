const db = require('../config/db');

const dashboardController = {
    getOverview: async (req, res) => {
        try {
            const userId = req.user.id;
            const today = new Date().toISOString().slice(0, 10);

            // 1. Task Stats
            const [taskStats] = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                    SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END) as doing,
                    SUM(CASE WHEN status != 'completed' AND due_date < NOW() THEN 1 ELSE 0 END) as overdue
                FROM tasks WHERE user_id = ?
            `, [userId]);

            // 2. Today's Plans
            const [todayPlans] = await db.execute(`
                SELECT * FROM plans 
                WHERE user_id = ? AND (DATE(start_time) = ? OR DATE(end_time) = ?)
                ORDER BY start_time ASC
            `, [userId, today, today]);

            // 3. Habit Streaks
            const [habits] = await db.execute(`
                SELECT id, title, current_streak, last_completed 
                FROM habits WHERE user_id = ?
            `, [userId]);

            // 4. Productivity (last 7 days completed tasks)
            const [productivity] = await db.execute(`
                SELECT DATE(created_at) as date, COUNT(*) as count 
                FROM tasks 
                WHERE user_id = ? AND status = 'completed' 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(created_at)
            `, [userId]);

            res.json({
                stats: taskStats[0],
                todayPlans,
                habits,
                productivity
            });
        } catch (error) {
            console.error('Overview error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy thông tin tổng quan.' });
        }
    }
};

module.exports = dashboardController;
