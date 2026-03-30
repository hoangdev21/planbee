const db = require('../config/db');
const { getBot } = require('./telegramBotStore');

const sendSimpleMessage = async (userId, message, retryCount = 0) => {
    try {
        const bot = getBot();
        if (!bot) {
            console.warn('Telegram bot not initialized yet.');
            return false;
        }

        const [users] = await db.execute('SELECT telegram_chat_id FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].telegram_chat_id) {
            const chatId = users[0].telegram_chat_id;
            try {
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                return true;
            } catch (error) {
                // Handle 429 Too Many Requests
                if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 429 && retryCount < 3) {
                    const waitTime = (error.response.body.parameters.retry_after || 5) * 1000;
                    console.log(`Telegram rate limited. Retrying after ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime + 500));
                    return sendSimpleMessage(userId, message, retryCount + 1);
                }
                throw error;
            }
        }
        return false;
    } catch (e) {
        console.error('Send Simple Message Error:', e.message);
        return false;
    }
};

module.exports = { sendSimpleMessage };
