const TelegramBot = require('node-telegram-bot-api');
const db = require('../config/db');
const aiController = require('../controllers/aiController');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.warn('TELEGRAM_BOT_TOKEN is not set in .env. Telegram Bot is disabled.');
    module.exports = { bot: null, sendSimpleMessage: null };
} else {
    const bot = new TelegramBot(token, { polling: true });

    const FE_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Helper to track messages in DB for clearing later
    async function trackMsg(chatId, msgId) {
        try {
            await db.execute('INSERT INTO telegram_messages (chat_id, message_id) VALUES (?, ?)', [chatId, msgId]);
        } catch (e) { console.error('Track Msg Error:', e); }
    }

    // Wrap bot.sendMessage to track it automatically
    const originalSendMessage = bot.sendMessage.bind(bot);
    bot.sendMessage = async function(chatId, text, options = {}) {
        const msg = await originalSendMessage(chatId, text, options);
        if (msg) trackMsg(chatId, msg.message_id);
        return msg;
    };

    // Helper to parse AI action tags into Telegram Markdown Links
    function parseAiResponse(text) {
        if (!text) return text;
        
        // Match [view_plan:title=...&date=YYYY-MM-DD&time=HH:MM]
        let parsed = text.replace(/\[view_plan:([^\]]+)\]/g, (match, query) => {
            const params = new URLSearchParams(query);
            const title = params.get('title') || 'Lịch trình';
            const date = params.get('date') || '';
            return `\n\n🔗 *Xem trên website:* [${title}](${FE_URL}/#/planning?date=${date})`;
        });

        // Match [view_habit:title=...]
        parsed = parsed.replace(/\[view_habit:title=([^\]]+)\]/g, (match, title) => {
            return `\n\n🔗 *Xem thói quen:* [${title}](${FE_URL}/#/habits)`;
        });

        return parsed;
    }

    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        
        const inline_keyboard = [[{ text: '🔑 Nhập mã ID PlanBee', callback_data: 'input_id' }]];
        
        // Telegram doesn't allow localhost URLs in inline buttons
        if (FE_URL && !FE_URL.includes('localhost') && !FE_URL.includes('127.0.0.1')) {
            inline_keyboard.push([{ text: '🌐 Mở Website', url: FE_URL }, { text: '🆘 Hỗ trợ', callback_data: 'support' }]);
        } else {
            inline_keyboard.push([{ text: '🆘 Hỗ trợ', callback_data: 'support' }]);
        }

        const opts = {
            reply_markup: { inline_keyboard },
            parse_mode: 'Markdown'
        };
        bot.sendMessage(chatId, "*Chào mừng bạn đến với PlanBee!* 🐝✨\n\nTôi là Trợ lý Bee, giúp bạn quản lý thời gian và năng suất ngay trên Telegram.\n\n_Vui lòng chọn một tùy chọn bên dưới:_", opts);
    });

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id;
        const data = query.data;

        if (data === 'input_id') {
            bot.sendMessage(chatId, "👉 *Vui lòng nhập mã ID* (ví dụ: `BEE-XXXXXX`) của bạn vào tin nhắn trả lời bên dưới:", {
                reply_markup: { force_reply: true },
                reply_to_message_id: query.message.message_id,
                parse_mode: 'Markdown'
            });
        } else if (data === 'support') {
            bot.sendMessage(chatId, "🐝 *Hỗ trợ PlanBee:*\nNếu bạn gặp khó khăn, hãy kiểm tra phần hướng dẫn trên website hoặc liên hệ Admin nhé!");
        }
        
        bot.answerCallbackQuery(query.id);
    });

    bot.onText(/\/clear/, async (msg) => {
        const chatId = msg.chat.id;
        try {
            // Track the /clear command itself
            await trackMsg(chatId, msg.message_id);

            // Fetch all message IDs for this chat
            const [rows] = await db.execute('SELECT message_id FROM telegram_messages WHERE chat_id = ?', [chatId]);
            const ids = rows.map(r => r.message_id);

            // Delete messages in parallel (some might fail if too old or deleted, ignore)
            await Promise.allSettled(ids.map(id => bot.deleteMessage(chatId, id)));

            // Clean up DB
            await db.execute('DELETE FROM telegram_messages WHERE chat_id = ?', [chatId]);

            // Inform user session was cleared
            const clearConfirm = await bot.sendMessage(chatId, "🧹 *Lịch sử trò chuyện đã được làm sạch!* \nBee đã sẵn sàng cho một bắt đầu mới. 🐝✨");
            // Don't track the confirmation message itself to avoid infinite clear loop, but let's track it for next clear
            // Actually, just track it normally.
            
        } catch (e) { 
            console.error('Clear Chat Error:', e);
            bot.sendMessage(chatId, "Ơ kìa, Bee không thể dọn dẹp lúc này. Thử lại nhé! 🐝💦");
        }
    });

    bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const helpMsg = `🐝 *Hướng dẫn sử dụng PlanBee Bot:*\n\n` +
                        `1️⃣ Nhấn /start để bắt đầu.\n` +
                        `2️⃣ Liên kết tài khoản bằng mã ID từ website.\n` +
                        `3️⃣ Chat trực tiếp để thêm lịch, task hoặc thói quen.\n` +
                        `4️⃣ Sử dụng /clear để làm mới cuộc hội thoại.\n\n` +
                        `*Ví dụ:* "Thêm lịch tập gym lúc 5h chiều mai"`;
        bot.sendMessage(chatId, helpMsg, { parse_mode: 'Markdown' });
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Track user message
        trackMsg(chatId, msg.message_id);

        if (!text || text.startsWith('/')) return;

        try {
            // Check if user is linked
            const [users] = await db.execute('SELECT id FROM users WHERE telegram_chat_id = ?', [chatId]);
            
            if (users.length === 0) {
                // Try to link with token
                if (text.startsWith('BEE-')) {
                    const [tokenUsers] = await db.execute('SELECT id, username, email, full_name FROM users WHERE telegram_token = ?', [text.toUpperCase()]);
                    if (tokenUsers.length > 0) {
                        const user = tokenUsers[0];
                        await db.execute('UPDATE users SET telegram_chat_id = ? WHERE id = ?', [chatId, user.id]);
                        
                        const profileMsg = `*Tài khoản của bạn đã được xác thực!* ✨\n\n` +
                                         `🐝 *Thông tin hồ sơ Bee:* \n` +
                                         `\`\`\`\n` +
                                         ` 👤 Tên:  ${user.full_name || 'Bee User'}\n` +
                                         ` 📧 Mail: ${user.email}\n` +
                                         ` 🆔 User: @${user.username}\n` +
                                         `\`\`\`\n\n` +
                                         `Bạn có thể bắt đầu sử dụng Bee rồi nhé. Nếu muốn đổi tài khoản, hãy liên hệ admin. 🐝`;
                        
                        bot.sendMessage(chatId, profileMsg, { 
                            parse_mode: 'Markdown',
                            reply_markup: { remove_keyboard: true }
                        });
                    } else {
                        bot.sendMessage(chatId, "❌ *Mã ID không chính xác.*\nVui lòng copy chính xác mã từ phần _Cài đặt_ trên Website và thử lại.", { parse_mode: 'Markdown' });
                    }
                } else {
                    bot.sendMessage(chatId, "🐝 *Bạn chưa xác thực.*\nHãy nhấn nút *Nhập mã ID* hoặc gửi trực tiếp mã BEE-XXXXXX để bắt đầu nhé!", { parse_mode: 'Markdown' });
                }
            } else {
                const userId = users[0].id;
                // User is linked, if they send a BEE- code, tell them they are already verified with details
                if (text.startsWith('BEE-')) {
                    const [fullUsers] = await db.execute('SELECT username, email, full_name FROM users WHERE id = ?', [users[0].id]);
                    const user = fullUsers[0];
                    const profileMsg = `*Tài khoản của bạn đã được xác thực!* ✨\n\n` +
                                     `🐝 *Thông tin hồ sơ Bee:* \n` +
                                     `\`\`\`\n` +
                                     ` 👤 Tên:  ${user.full_name || 'Bee User'}\n` +
                                     ` 📧 Mail: ${user.email}\n` +
                                     ` 🆔 User: @${user.username}\n` +
                                     `\`\`\`\n\n` +
                                     `Bạn có thể bắt đầu sử dụng Bee rồi nhé. Nếu muốn đổi tài khoản, hãy liên hệ admin. 🐝`;
                    
                    bot.sendMessage(chatId, profileMsg, { 
                        parse_mode: 'Markdown',
                        reply_markup: { remove_keyboard: true } 
                    });
                    return;
                }

                // Show "typing" status
                bot.sendChatAction(chatId, 'typing');
                
                const rawResponse = await aiController.processChat(userId, text, [], 'telegram');
                const formattedResponse = parseAiResponse(rawResponse);
                bot.sendMessage(chatId, formattedResponse, { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('Telegram Bot Error:', error);
            bot.sendMessage(chatId, "Ơ kìa, Bee đang gặp chút lỗi. Bạn thử lại sau nhé! 🐝💦");
        }
    });

    const { setBot } = require('./telegramBotStore');
    setBot(bot);

    console.log('Telegram Bot is running...');
    module.exports = bot;
}
