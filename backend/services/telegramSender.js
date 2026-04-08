const db = require('../config/db');
const { getBot } = require('./telegramBotStore');

const sendSimpleMessage = async (userId, message, retryCount = 0) => {
    try {
        console.log(`[Telegram] Attempting to send message to user ${userId}...`);
        const bot = getBot();
        if (!bot) {
            console.warn('[Telegram] Bot instance is null. Is it initialized?');
            return false;
        }

        const [users] = await db.execute('SELECT telegram_chat_id, username FROM users WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].telegram_chat_id) {
            const chatId = users[0].telegram_chat_id;
            console.log(`[Telegram] Sending to chat ${chatId} for user ${users[0].username}...`);
            try {
                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
                console.log(`[Telegram] Message sent successfully to ${chatId}`);
                return true;
            } catch (error) {
                console.error(`[Telegram] sendMessage failed: ${error.message}`);
                // Handle 429 Too Many Requests
                if (error.code === 'ETELEGRAM' && error.response && error.response.statusCode === 429 && retryCount < 3) {
                    const waitTime = (error.response.body.parameters.retry_after || 5) * 1000;
                    console.log(`[Telegram] Rate limited. Retrying after ${waitTime}ms...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime + 500));
                    return sendSimpleMessage(userId, message, retryCount + 1);
                }
                throw error;
            }
        } else {
            console.log(`[Telegram] User ${userId} has no telegram_chat_id linked.`);
        }
        return false;
    } catch (e) {
        console.error('[Telegram] Send Simple Message Error:', e.message);
        return false;
    }
};

module.exports = { sendSimpleMessage };
