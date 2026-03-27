const db = require('../config/db');

class NotificationController {
    static async getAll(req, res) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
                [req.user.id]
            );
            res.json({ success: true, notifications: rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async markAsRead(req, res) {
        try {
            await db.execute(
                'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
                [req.user.id]
            );
            res.json({ success: true, message: 'Notifications marked as read' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }

    static async create(userId, message) {
        try {
            await db.execute(
                'INSERT INTO notifications (user_id, message) VALUES (?, ?)',
                [userId, message]
            );
            return true;
        } catch (error) {
            console.error('Error creating notification:', error);
            return false;
        }
    }

    static async delete(req, res) {
        try {
            await db.execute('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
            res.json({ success: true, message: 'Notification deleted' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}

module.exports = NotificationController;
