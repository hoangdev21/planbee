const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    console.log('--- DIAGNOSTIC DB START ---');
    console.log('Connecting to host:', process.env.DB_HOST);
    console.log('Using database:', process.env.DB_NAME);
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'planbee_db',
            ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined
        });

        console.log('✅ Connection successful!');

        const [dbInfo] = await connection.execute('SELECT database() as current_db');
        console.log('Current Database in session:', dbInfo[0].current_db);

        console.log('\nChecking column "reminder_sent" in tasks table:');
        const [taskCols] = await connection.execute('DESCRIBE tasks');
        const hasRemT = taskCols.some(c => c.Field === 'reminder_sent');
        console.log('Tasks table has "reminder_sent":', hasRemT ? 'YES' : 'NO');

        console.log('\nChecking column "reminder_sent" in plans table:');
        const [planCols] = await connection.execute('DESCRIBE plans');
        const hasRemP = planCols.some(c => c.Field === 'reminder_sent');
        console.log('Plans table has "reminder_sent":', hasRemP ? 'YES' : 'NO');

        if (!hasRemT || !hasRemP) {
            console.log('\n⚠️ MISSING COLUMNS DETECTED. The app will fail if not fixed.');
        }

    } catch (error) {
        console.error('❌ DB Diagnostic Failed:', error.message);
    } finally {
        if (connection) await connection.end();
        console.log('--- DIAGNOSTIC DB END ---');
    }
}

testConnection();
