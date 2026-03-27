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

        console.log('--- Bắt đầu cập nhật Database (Migration v2) ---');

        const alterQueries = [
            { table: 'plans', column: 'color', query: "ALTER TABLE plans ADD COLUMN color VARCHAR(20) DEFAULT '#FFA726'" },
            { table: 'plans', column: 'priority', query: "ALTER TABLE plans ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium'" },
            { table: 'plans', column: 'status', query: "ALTER TABLE plans ADD COLUMN status ENUM('pending', 'doing', 'completed', 'cancelled') DEFAULT 'pending'" },
            { table: 'habits', column: 'preferred_time', query: "ALTER TABLE habits ADD COLUMN preferred_time TIME" }
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

        console.log('--- Hoàn tất quá trình cập nhật! ---');
    } catch (error) {
        console.error('❌ Lỗi kết nối hoặc thực thi:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
