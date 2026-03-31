const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
    // Register
    register: async (req, res) => {
        try {
            const { username, email, password } = req.body;
            
            // Validate
            if (!username || !email || !password) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin!' });
            }

            // Check existing
            const [existing] = await db.execute(
                'SELECT * FROM users WHERE email = ? OR username = ?',
                [email, username]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'Người dùng hoặc email đã tồn tại!' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert user
            const telegram_token = "BEE-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            const [result] = await db.execute(
                'INSERT INTO users (username, email, password, telegram_token) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, telegram_token]
            );

            const userId = result.insertId;

            // Initialize default settings
            await db.execute(
                'INSERT INTO user_settings (user_id, theme) VALUES (?, ?)',
                [userId, 'light']
            );

            // Generate Token
            const token = jwt.sign(
                { id: userId, username, role: 'user' },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            res.status(201).json({
                message: 'Đăng ký thành công!',
                user: { id: userId, username, email },
                token
            });
        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({ message: 'Lỗi máy chủ khi đăng ký.' });
        }
    },

    // Login
    login: async (req, res) => {
        try {
            const { username, password } = req.body;

            // Find user
            const [users] = await db.execute(
                'SELECT * FROM users WHERE username = ? OR email = ?',
                [username, username]
            );

            if (users.length === 0) {
                return res.status(401).json({ message: 'Tài khoản không tồn tại!' });
            }

            const user = users[0];

            // Verify
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Mật khẩu không chính xác!' });
            }

            // Token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET || 'secret',
                { expiresIn: '7d' }
            );

            // Fetch user settings
            const [settings] = await db.execute(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [user.id]
            );

            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            res.json({
                message: 'Đăng nhập thành công!',
                user: { 
                    id: user.id, 
                    username: user.username, 
                    email: user.email, 
                    role: user.role, 
                    account_type: user.account_type 
                },
                settings: settings[0] || { theme: 'light', accent_color: '#FFA726' },
                token
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Lỗi máy chủ khi đăng nhập.' });
        }
    },

    // Get current profile
    getProfile: async (req, res) => {
        try {
            const [users] = await db.execute(
                'SELECT id, username, email, full_name, bio, profile_image, created_at, telegram_token, telegram_chat_id FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0) {
                return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
            }

            const [settings] = await db.execute(
                'SELECT * FROM user_settings WHERE user_id = ?',
                [req.user.id]
            );

            res.json({ user: users[0], settings: settings[0] || {} });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi lấy thông tin.' });
        }
    },

    // Logout
    logout: (req, res) => {
        res.clearCookie('token');
        res.json({ message: 'Đã đăng xuất.' });
    },

    // Update Profile
    updateProfile: async (req, res) => {
        try {
            const { username, email, full_name, bio } = req.body;
            
            // Check if username/email already taken by another user
            const [existing] = await db.execute(
                'SELECT * FROM users WHERE (email = ? OR username = ?) AND id != ?',
                [email, username, req.user.id]
            );

            if (existing.length > 0) {
                return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã được sử dụng!' });
            }

            await db.execute(
                'UPDATE users SET username = ?, email = ?, full_name = ?, bio = ? WHERE id = ?',
                [username, email, full_name || null, bio || null, req.user.id]
            );

            res.json({ success: true, message: 'Cập nhật thông tin thành công!' });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật thông tin.' });
        }
    },

    // Change Password
    changePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            const [users] = await db.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
            const user = users[0];

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác!' });
            }

            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            await db.execute('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, req.user.id]);

            res.json({ success: true, message: 'Đổi mật khẩu thành công!' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ message: 'Lỗi khi đổi mật khẩu.' });
        }
    },

    // Update Settings
    updateSettings: async (req, res) => {
        try {
            const { theme, notifications_enabled, accent_color } = req.body;
            await db.execute(
                'INSERT INTO user_settings (user_id, theme, notifications_enabled, accent_color) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE theme = VALUES(theme), notifications_enabled = VALUES(notifications_enabled), accent_color = VALUES(accent_color)',
                [req.user.id, theme || 'light', notifications_enabled !== undefined ? notifications_enabled : true, accent_color || '#FFA726']
            );
            res.json({ success: true, message: 'Cài đặt đã được lưu!' });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ message: 'Lỗi khi lưu cài đặt.' });
        }
    },
    // Unlink Telegram
    unlinkTelegram: async (req, res) => {
        try {
            const [users] = await db.execute(
                'SELECT username, telegram_chat_id FROM users WHERE id = ?',
                [req.user.id]
            );

            if (users.length === 0 || !users[0].telegram_chat_id) {
                return res.status(400).json({ message: 'Tài khoản chưa được liên kết Telegram!' });
            }

            const { username } = users[0];

            // Send final notification via Telegram before unlinking
            const { sendSimpleMessage } = require('../services/telegramSender');
            if (sendSimpleMessage) {
                const tgMsg = `👋 *Thông báo hủy liên kết!* 🐝\n\nBạn vừa thực hiện hủy liên kết giữa tài khoản Telegram này và tài khoản PlanBee: *"${username}"*.\n\n_Từ giờ bạn sẽ không nhận được thông báo nhắc lịch qua đây nữa. Hẹn gặp lại bạn nhé!_ ✨`;
                await sendSimpleMessage(req.user.id, tgMsg);
            }

            // Unlink in DB
            await db.execute('UPDATE users SET telegram_chat_id = NULL WHERE id = ?', [req.user.id]);

            res.json({ success: true, message: 'Đã hủy liên kết Telegram thành công!' });
        } catch (error) {
            console.error('Unlink Telegram error:', error);
            res.status(500).json({ message: 'Lỗi khi hủy liên kết Telegram.' });
        }
    }
};

module.exports = authController;
