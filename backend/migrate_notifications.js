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

        console.log('--- Cập nhật bảng notifications ---');

        const alterQueries = [
            { table: 'notifications', column: 'type', query: "ALTER TABLE notifications ADD COLUMN type VARCHAR(50) DEFAULT NULL" },
            { table: 'notifications', column: 'target_id', query: "ALTER TABLE notifications ADD COLUMN target_id INT DEFAULT NULL" }
        ];

        for (const q of alterQueries) {
            try {
                await connection.execute(q.query);
                console.log(`Đã thêm cột ${q.column} vào bảng ${q.table}`);
            } catch (e) {
                if (e.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Cột ${q.column} đã tồn tại trong bảng ${q.table}`);
                } else {
                    console.error(`Lỗi khi thêm cột ${q.column}:`, e.message);
                }
            }
        }

        console.log('--- Hoàn tất ---');
    } catch (error) {
        console.error('Lỗi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
