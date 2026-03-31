const db = require('../config/db');

const adminController = {
    getStats: async (req, res) => {
        try {
            // 1. User growth (Sign-ups by day)
            const [growth] = await db.execute('SELECT DATE(created_at) as date, COUNT(*) as count FROM users GROUP BY DATE(created_at) ORDER BY date DESC LIMIT 30');
            
            // 2. Engagement stats
            const [[userCount]] = await db.execute('SELECT COUNT(*) as total FROM users');
            const [[taskCount]] = await db.execute('SELECT COUNT(*) as total FROM tasks');
            const [[planCount]] = await db.execute('SELECT COUNT(*) as total FROM plans');
            const [[habitCount]] = await db.execute('SELECT COUNT(*) as total FROM habits');
            
            const tasksPerUser = userCount.total > 0 ? (taskCount.total / userCount.total).toFixed(1) : 0;
            
            // 3. AI Key Status (Simulated based on groqKeys count)
            const groqCount = 7; // As defined in aiController

            res.json({
                growth: growth.reverse(),
                summary: {
                    totalUsers: userCount.total,
                    avgTasks: tasksPerUser,
                    totalPlans: planCount.total,
                    totalHabits: habitCount.total,
                    aiKeysStatus: `${groqCount} Active`
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getUsers: async (req, res) => {
        try {
            const [users] = await db.execute('SELECT id, username, email, full_name, role, account_type, is_active, created_at FROM users ORDER BY created_at DESC');
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateUser: async (req, res) => {
        const { id } = req.params;
        const { role, account_type, is_active } = req.body;
        try {
            await db.execute('UPDATE users SET role = ?, account_type = ?, is_active = ? WHERE id = ?', [role, account_type, is_active, id]);
            res.json({ message: 'User updated successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAIConfig: async (req, res) => {
        try {
            const [rows] = await db.execute('SELECT * FROM system_config WHERE \`key\` = ?', ['ai_system_prompt']);
            res.json(rows[0] ? rows[0].value : '');
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    updateAIConfig: async (req, res) => {
        const { prompt } = req.body;
        try {
            await db.execute('INSERT INTO system_config (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = ?', ['ai_system_prompt', prompt, prompt]);
            res.json({ message: 'System Prompt updated' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    broadcastNotification: async (req, res) => {
        const { message, platform } = req.body; // platform: 'web', 'telegram', 'both'
        try {
            const [users] = await db.execute('SELECT id FROM users WHERE is_active = 1');
            for (const user of users) {
                if (platform === 'web' || platform === 'both') {
                    await db.execute('INSERT INTO notifications (user_id, message) VALUES (?, ?)', [user.id, message]);
                }
                // Telegram broadcast logic if needed (requires more complex bot logic)
            }
            res.json({ message: `Broadcast sent to ${users.length} users` });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getLogs: async (req, res) => {
        try {
            const [chatLogs] = await db.execute('SELECT c.*, u.username FROM chat_logs c LEFT JOIN users u ON c.user_id = u.id ORDER BY c.created_at DESC LIMIT 50');
            const [errorLogs] = await db.execute('SELECT * FROM error_logs ORDER BY created_at DESC LIMIT 50');
            res.json({ chatLogs, errorLogs });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
};

module.exports = adminController;
