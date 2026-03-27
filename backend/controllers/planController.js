const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const NotificationController = require('./notificationController');

const planController = {
    // Get all user plans
    getPlans: async (req, res) => {
        try {
            const [plans] = await db.execute(
                'SELECT * FROM plans WHERE user_id = ? ORDER BY start_time ASC',
                [req.user.id]
            );
            res.json({ plans });
        } catch (error) {
            console.error('Get plans error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy kế hoạch.' });
        }
    },

    // Create a plan
    createPlan: async (req, res) => {
        try {
            const { title, description, start_time, end_time, color, priority } = req.body;
            
            if (!title || !start_time || !end_time) {
                return res.status(400).json({ message: 'Vui lòng nhập tên, thời gian bắt đầu và kết thúc!' });
            }

            const MySQLStart = formatDateForMySQL(start_time);
            const MySQLEnd = formatDateForMySQL(end_time);

            if (new Date(start_time) >= new Date(end_time)) {
                return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu!' });
            }

            // Check for overlaps
            const [overlaps] = await db.execute(
                'SELECT title FROM plans WHERE user_id = ? AND start_time < ? AND end_time > ?',
                [req.user.id, MySQLEnd, MySQLStart]
            );

            if (overlaps.length > 0) {
                return res.status(400).json({ 
                    message: `Lịch bị trùng với kế hoạch: "${overlaps[0].title}". Vui lòng chọn thời giờ khác! 🐝` 
                });
            }

            const [result] = await db.execute(
                'INSERT INTO plans (user_id, title, description, start_time, end_time, color, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user.id, title, description || '', MySQLStart, MySQLEnd, color || '#FFA726', priority || 'medium']
            );

            await NotificationController.create(req.user.id, `Bạn đã lập kế hoạch mới: "${title}"`);
            res.status(201).json({ id: result.insertId, message: 'Lập kế hoạch thành công!' });
        } catch (error) {
            console.error('Create plan error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo kế hoạch.' });
        }
    },

    // Update a plan
    updatePlan: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, start_time, end_time, color, status, priority } = req.body;
            
            const MySQLStart = formatDateForMySQL(start_time);
            const MySQLEnd = formatDateForMySQL(end_time);

            // Check for overlaps (excluding current plan)
            const [overlaps] = await db.execute(
                'SELECT title FROM plans WHERE user_id = ? AND id != ? AND start_time < ? AND end_time > ?',
                [req.user.id, id, MySQLEnd, MySQLStart]
            );

            if (overlaps.length > 0) {
                return res.status(400).json({ 
                    message: `Cập nhật thất bại! Thời gian này bị trùng với kế hoạch: "${overlaps[0].title}".` 
                });
            }

            const [result] = await db.execute(
                'UPDATE plans SET title = ?, description = ?, start_time = ?, end_time = ?, color = ?, status = ?, priority = ? WHERE id = ? AND user_id = ?',
                [title, description, MySQLStart, MySQLEnd, color, status || 'pending', priority || 'medium', id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy kế hoạch.' });
            }
            res.json({ message: 'Cập nhật thành công!' });
        } catch (error) {
            console.error('Update plan error:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật.' });
        }
    },

    // Delete a plan
    deletePlan: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute('DELETE FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
            res.json({ message: 'Đã xóa kế hoạch.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa.' });
        }
    }
};

module.exports = planController;
