const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/Workspace/website/plan-bee/backend/.env' });

async function checkTasks() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'planbee'
    });

    try {
        const [tasks] = await connection.execute('SELECT * FROM tasks');
        const [plans] = await connection.execute('SELECT * FROM plans');
        console.log('--- TASKS ---');
        console.log(JSON.stringify(tasks, null, 2));
        console.log('--- PLANS ---');
        console.log(JSON.stringify(plans, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

checkTasks();
