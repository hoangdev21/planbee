require('dotenv').config();
const db = require('./config/db');

async function run() {
    try {
        console.log('--- STARTING ADMIN MIGRATION ---');
        
        // 1. Update users table (just in case previous ran partially)
        try {
            await db.execute("ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user'");
            await db.execute("ALTER TABLE users ADD COLUMN account_type ENUM('free', 'premium') DEFAULT 'free'");
            await db.execute("ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1");
        } catch (e) {
            console.log('Columns might already exist, skipping...');
        }

        // 2. System Config
        await db.execute(`
            CREATE TABLE IF NOT EXISTS system_config (
                \`key\` VARCHAR(50) PRIMARY KEY,
                \`value\` TEXT,
                \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 3. Chat Logs
        await db.execute(`
            CREATE TABLE IF NOT EXISTS chat_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NULL,
                message TEXT,
                response TEXT,
                tokens_used INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 4. Error Logs
        await db.execute(`
            CREATE TABLE IF NOT EXISTS error_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                error_message TEXT,
                stack_trace TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `);

        // 5. Initial Data
        await db.execute("INSERT IGNORE INTO system_config (\`key\`, \`value\`) VALUES ('ai_system_prompt', 'Bạn là Bee - Trợ lý AI thông minh...')");
        
        // 6. Set first user as admin
        await db.execute("UPDATE users SET role = 'admin', account_type = 'premium' LIMIT 1");

        console.log('--- ADMIN MIGRATION SUCCESSFUL ---');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

run();
