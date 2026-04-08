const db = require('./config/db');
const bcrypt = require('bcryptjs');

async function seedAdmin() {
    const username = 'hoangdev21';
    const email = 'hoangdev21@gmail.com';
    const password = 'hoangdev21';
    const role = 'admin';
    const accountType = 'premium';

    try {
        console.log('--- PlanBee Admin Seeding (hoangdev11) ---');
        
        // 1. Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            console.log(`User ${email} already exists. Updating to Admin...`);
            await db.execute(
                'UPDATE users SET role = ?, account_type = ?, is_active = 1 WHERE email = ?',
                [role, accountType, email]
            );
            console.log('User updated successfully! ✅');
            process.exit(0);
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        const telegram_token = "BEE-" + Math.random().toString(36).substr(2, 9).toUpperCase();

        // 3. Insert user
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password, role, account_type, is_active, telegram_token) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, accountType, 1, telegram_token]
        );

        const userId = result.insertId;

        // 4. Initialize default settings
        await db.execute(
            'INSERT INTO user_settings (user_id, theme, accent_color) VALUES (?, ?, ?)',
            [userId, 'light', '#FFA726']
        );

        console.log(`Admin account created successfully! 🐝`);
        console.log(`Username: ${username}`);
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log('---------------------------');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
}

seedAdmin();
