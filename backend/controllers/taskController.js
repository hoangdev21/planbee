const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const NotificationController = require('./notificationController');

const taskController = {
    // Get all user tasks
    getTasks: async (req, res) => {
        try {
            const [tasks] = await db.execute(
                'SELECT * FROM tasks WHERE user_id = ? ORDER BY due_date ASC',
                [req.user.id]
            );
            res.json({ tasks });
        } catch (error) {
            console.error('Get tasks error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy danh sách nhiệm vụ.' });
        }
    },

    // Create task
    createTask: async (req, res) => {
        try {
            const { title, description, priority, due_date } = req.body;
            
            if (!title) {
                return res.status(400).json({ message: 'Tiêu đề không được để trống!' });
            }

            const MySQLDueDate = formatDateForMySQL(due_date);

            const [result] = await db.execute(
                'INSERT INTO tasks (user_id, title, description, priority, due_date) VALUES (?, ?, ?, ?, ?)',
                [req.user.id, title, description || '', priority || 'medium', MySQLDueDate]
            );

            await NotificationController.create(req.user.id, `Bạn đã tạo nhiệm vụ mới: "${title}"`);
            res.status(201).json({ id: result.insertId, title, message: 'Thêm nhiệm vụ thành công!' });
        } catch (error) {
            console.error('Create task error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo nhiệm vụ.' });
        }
    },

    // Update task
    updateTask: async (req, res) => {
        try {
            const { id } = req.params;
            const { title, description, status, priority, due_date } = req.body;

            const MySQLDueDate = formatDateForMySQL(due_date);

            const [result] = await db.execute(
                'UPDATE tasks SET title = ?, description = ?, status = ?, priority = ?, due_date = ? WHERE id = ? AND user_id = ?',
                [title, description, status, priority, MySQLDueDate, id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ hoặc không có quyền sửa.' });
            }

            if (status === 'completed') {
                await NotificationController.create(req.user.id, `Bạn đã hoàn thành nhiệm vụ: "${title}"`);
            }
            res.json({ message: 'Cập nhật thành công!' });
        } catch (error) {
            console.error('Update task error:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật nhiệm vụ.' });
        }
    },

    // Delete task
    deleteTask: async (req, res) => {
        try {
            const { id } = req.params;
            const [result] = await db.execute(
                'DELETE FROM tasks WHERE id = ? AND user_id = ?',
                [id, req.user.id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy nhiệm vụ.' });
            }

            res.json({ message: 'Xóa nhiệm vụ thành công!' });
        } catch (error) {
            console.error('Delete task error:', error);
            res.status(500).json({ message: 'Lỗi khi xóa nhiệm vụ.' });
        }
    },

    // Get statistics for dashboard
    getStats: async (req, res) => {
        try {
            const queries = [
                db.execute('SELECT COUNT(*) as completed FROM tasks WHERE user_id = ? AND status = ?', [req.user.id, 'completed']),
                db.execute('SELECT COUNT(*) as doing FROM tasks WHERE user_id = ? AND status = ?', [req.user.id, 'doing']),
                db.execute('SELECT COUNT(*) as pending FROM tasks WHERE user_id = ? AND status = ?', [req.user.id, 'pending']),
                db.execute('SELECT COUNT(*) as overdue FROM tasks WHERE user_id = ? AND status != ? AND due_date < NOW()', [req.user.id, 'completed']),
            ];

            const results = await Promise.all(queries);
            
            res.json({
                completed: results[0][0][0].completed,
                doing: results[1][0][0].doing,
                pending: results[2][0][0].pending,
                overdue: results[3][0][0].overdue
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ message: 'Lỗi lấy thống kê.' });
        }
    }
};

module.exports = taskController;
