const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'planbee_db'
        });

        console.log('--- Thêm cột reminder_sent vào bảng plans & tasks ---');

        const alterQueries = [
            { table: 'plans', column: 'reminder_sent', query: "ALTER TABLE plans ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0" },
            { table: 'tasks', column: 'reminder_sent', query: "ALTER TABLE tasks ADD COLUMN reminder_sent TINYINT(1) DEFAULT 0" }
        ];

        for (const q of alterQueries) {
            try {
                await connection.execute(q.query);
                console.log(`✅ Đã thêm cột ${q.column} vào bảng ${q.table}`);
            } catch (e) {
                if (e.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`ℹ️ Cột ${q.column} đã tồn tại trong bảng ${q.table}`);
                } else {
                    console.error(`❌ Lỗi khi thêm cột ${q.column}:`, e.message);
                }
            }
        }

        console.log('--- Hoàn tất ---');
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
