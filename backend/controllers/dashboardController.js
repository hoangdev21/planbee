const db = require('../config/db');

const dashboardController = {
    getOverview: async (req, res) => {
        try {
            const userId = req.user.id;
            const today = new Date().toISOString().slice(0, 10);

            // 1. Combined Stats (Tasks + Plans)
            const [[taskStats]] = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
                    COALESCE(SUM(CASE WHEN status = 'doing' THEN 1 ELSE 0 END), 0) as doing,
                    COALESCE(SUM(CASE WHEN status != 'completed' AND due_date < NOW() THEN 1 ELSE 0 END), 0) as overdue
                FROM tasks WHERE user_id = ?
            `, [userId]);

            const [[planStats]] = await db.execute(`
                SELECT 
                    COUNT(*) as total,
                    COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
                    COALESCE(SUM(CASE WHEN status != 'completed' AND end_time < NOW() THEN 1 ELSE 0 END), 0) as overdue
                FROM plans WHERE user_id = ?
            `, [userId]);

            const combinedStats = {
                total: (taskStats.total || 0) + (planStats.total || 0),
                completed: (taskStats.completed || 0) + (planStats.completed || 0),
                doing: (taskStats.doing || 0),
                overdue: (taskStats.overdue || 0) + (planStats.overdue || 0)
            };

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

            // 4. Productivity (Monday to Sunday of current week)
            const [productivity] = await db.execute(`
                SELECT date, SUM(count) as count FROM (
                    SELECT DATE(updated_at) as date, COUNT(*) as count 
                    FROM tasks 
                    WHERE user_id = ? AND status = 'completed' 
                    AND YEARWEEK(updated_at, 1) = YEARWEEK(NOW(), 1)
                    GROUP BY DATE(updated_at)
                    
                    UNION ALL
                    
                    SELECT DATE(updated_at) as date, COUNT(*) as count 
                    FROM plans 
                    WHERE user_id = ? AND status = 'completed' 
                    AND YEARWEEK(updated_at, 1) = YEARWEEK(NOW(), 1)
                    GROUP BY DATE(updated_at)
                ) combined 
                GROUP BY date
                ORDER BY date ASC
            `, [userId, userId]);

            res.json({
                stats: combinedStats,
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
