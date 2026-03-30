const db = require('./config/db');

async function migrate() {
    try {
        console.log('Running migration...');
        
        try {
            await db.execute('ALTER TABLE users ADD COLUMN telegram_token VARCHAR(50) UNIQUE DEFAULT NULL');
        } catch (e) {
            if (!e.message.includes('Duplicate column')) throw e;
        }

        try {
            await db.execute('ALTER TABLE users ADD COLUMN telegram_chat_id BIGINT UNIQUE DEFAULT NULL');
        } catch (e) {
            if (!e.message.includes('Duplicate column')) throw e;
        }
        
        // Generate tokens for existing users
        const [users] = await db.execute('SELECT id FROM users WHERE telegram_token IS NULL');
        for (const user of users) {
            const token = "BEE-" + Math.random().toString(36).substr(2, 9).toUpperCase();
            await db.execute('UPDATE users SET telegram_token = ? WHERE id = ?', [token, user.id]);
        }
        
        console.log('Migration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
