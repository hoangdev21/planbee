const db = require('../config/db');

const habitController = {
    // Get all user habits
    getHabits: async (req, res) => {
        try {
            const [habits] = await db.execute(
                'SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC',
                [req.user.id]
            );
            res.json({ habits });
        } catch (error) {
            console.error('Get habits error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách thói quen.' });
        }
    },

    // Create habit
    createHabit: async (req, res) => {
        try {
            const { title, description, frequency, goal, preferred_time } = req.body;
            
            if (!title) {
                return res.status(400).json({ message: 'Tiêu đề không được để trống!' });
            }

            const [result] = await db.execute(
                'INSERT INTO habits (user_id, title, description, frequency, goal, preferred_time) VALUES (?, ?, ?, ?, ?, ?)',
                [req.user.id, title, description || '', frequency || 'daily', goal || 1, preferred_time || null]
            );

            res.status(201).json({ id: result.insertId, title, message: 'Thêm thói quen thành công!' });
        } catch (error) {
            console.error('Create habit error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo thói quen.' });
        }
    },

    // Check-in habit
    checkIn: async (req, res) => {
        try {
            const { id } = req.params;
            const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

            // Verify habit belongs to user
            const [habits] = await db.execute('SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
            if (habits.length === 0) return res.status(404).json({ message: 'Không tìm thấy thói quen.' });

            const habit = habits[0];

            // If already completed today, maybe toggle or do nothing
            // For now, let's increment streak if it's a new day
            let newStreak = habit.current_streak;
            const lastCompleted = habit.last_completed
                ? (habit.last_completed instanceof Date
                    ? habit.last_completed.toISOString().slice(0, 10)
                    : String(habit.last_completed).slice(0, 10))
                : null;

            if (lastCompleted !== today) {
                newStreak += 1;
            }

            await db.execute(
                'UPDATE habits SET current_streak = ?, last_completed = ? WHERE id = ?',
                [newStreak, today, id]
            );

            res.json({ message: 'Check-in thành công!', newStreak });
        } catch (error) {
            console.error('Check-in error:', error);
            res.status(500).json({ message: 'Lỗi khi check-in.' });
        }
    },

    // Delete habit
    deleteHabit: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute('DELETE FROM habits WHERE id = ? AND user_id = ?', [id, req.user.id]);
            res.json({ message: 'Đã xóa thói quen.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa.' });
        }
    }
};

module.exports = habitController;
