const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const { pickUniquePlanColor } = require('../utils/planColor');
const { isShortPlanRange, findLongPlanDailyConflict } = require('../utils/planOverlap');
const NotificationController = require('./notificationController');
const { sendSimpleMessage } = require('../services/telegramSender');

const DEFAULT_SYSTEM_PROMPT = `Bạn là Bee - Trợ lý AI đặc biệt của hệ thống Plan-Bee.
NHIỆM VỤ CHÍNH: Hỗ trợ người dùng quản lý công việc (tasks), lên lịch trình (plans), xây dựng thói quen (habits) và hướng dẫn sử dụng các tính năng của website Plan-Bee.

QUY TẮC QUAN TRỌNG:
1. LUÔN LUÔN sử dụng tiếng Việt 100%. Tuyệt đối không sử dụng ký tự lạ từ ngôn ngữ khác (tiếng Trung, Nhật...).
2. Thân thiện và lịch sự: Hãy chào hỏi lại nếu người dùng chào bạn. Đừng quá khắt khe với các câu nói giao tiếp thông thường (như "chào", "hi", "cảm ơn").
3. Tập trung chuyên môn: Sau khi chào hỏi, hãy hướng người dùng về các dịch vụ của Plan-Bee (lên kế hoạch, xem lịch, quản lý thói quen).
4. TỪ CHỐI khéo léo các yêu cầu ngoài phạm vi (như viết code, làm toán, hay kể chuyện phi hữu ích) bằng cách nói rằng Bee được tạo ra để giúp họ tăng năng suất trên Plan-Bee.
5. Khi người dùng yêu cầu đổi màu bằng tên gọi, hãy chuyển đổi sang mã Hex tương ứng khi dùng công cụ.
6. Tuyệt đối không in ra các mã code kỹ thuật. Hãy trả lời tự nhiên, kèm icon 🐝.`;

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());
const toPlanDate = (dateTimeValue) => String(dateTimeValue || '').slice(0, 10);
const toPlanTime = (dateTimeValue) => String(dateTimeValue || '').slice(11, 16);

const makeActionTag = (action, params = {}) => {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            query.set(key, String(value));
        }
    }

    return `[${action}:${query.toString()}]`;
};

let aiInfraReadyPromise = null;

async function ensureAiInfraReady() {
    if (aiInfraReadyPromise) return aiInfraReadyPromise;

    aiInfraReadyPromise = (async () => {
        try {
            await db.execute(`
                CREATE TABLE IF NOT EXISTS system_config (
                    \`key\` VARCHAR(50) PRIMARY KEY,
                    \`value\` TEXT,
                    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);

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

            await db.execute(`
                CREATE TABLE IF NOT EXISTS error_logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    error_message TEXT,
                    stack_trace TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            `);

            await db.execute(
                'INSERT INTO system_config (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)',
                ['ai_system_prompt', DEFAULT_SYSTEM_PROMPT]
            );
        } catch (infraError) {
            // Do not block chat flow when optional infra/log tables are not available.
            console.warn('[AI Infra] Optional setup failed:', infraError.message);
        }
    })();

    return aiInfraReadyPromise;
}

// Cấu hình nhiều API Key để xoay vòng khi hết lượt (Rate Limit)
const groqKeys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7
].filter(k => k && k.trim() !== '');

let currentKeyIndex = 0;
const groqKeyStats = {}; // Tracks { remainingReqs, limitReqs, remainingTokens, limitTokens } per key index

async function fetchWithRotation(body) {
    if (groqKeys.length === 0) {
        throw new Error("Chưa cấu hình GROQ_API_KEY nào trong .env");
    }

    let lastError = null;
    // Thử tối đa qua tất cả các key nếu bị rate limit
    for (let i = 0; i < groqKeys.length; i++) {
        const index = (currentKeyIndex + i) % groqKeys.length;
        const key = groqKeys[index];

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${key}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });
            clearTimeout(timeout);

            const reqRem = response.headers.get('x-ratelimit-remaining-requests');
            const reqLim = response.headers.get('x-ratelimit-limit-requests');
            const tokRem = response.headers.get('x-ratelimit-remaining-tokens');
            const tokLim = response.headers.get('x-ratelimit-limit-tokens');

            if (reqRem) {
                groqKeyStats[index] = {
                    remainingReqs: parseInt(reqRem, 10),
                    limitReqs: reqLim ? parseInt(reqLim, 10) : 14400,
                    remainingTokens: tokRem ? parseInt(tokRem, 10) : 100000,
                    limitTokens: tokLim ? parseInt(tokLim, 10) : 100000,
                    lastUpdated: Date.now()
                };
            }

            const data = await response.json();

            if (data.error) {
                const errorCode = data.error.code || '';
                const errorMsg = data.error.message || '';
                console.warn(`[Groq Key ${index + 1}] Error: ${errorCode} - ${errorMsg}`);

                // Nếu lỗi do hết lượt (rate limit), thử key tiếp theo
                if (errorCode === 'rate_limit_exceeded' || response.status === 429) {
                    lastError = data.error;
                    continue;
                }
                
                // Nếu lỗi tool_use_failed, trả về data luôn để controller xử lý fallback
                if (errorCode === 'tool_use_failed') return data;

                // Các lỗi khác có thể do payload, thử key khác nếu còn
                lastError = data.error;
                continue;
            }

            // Thành công: cập nhật index hiện tại để lần sau dùng tiếp key này
            currentKeyIndex = index;
            return data;
        } catch (err) {
            console.error(`[Groq Key ${index + 1}] Fetch failed:`, err.message);
            lastError = err;
        }
    }

    throw new Error(lastError ? (lastError.message || JSON.stringify(lastError)) : "Tất cả API Key đều thất bại.");
}

const aiController = {
    getGroqStats: () => {
        const statsArray = [];
        // Giả sử có 7 config slot (process.env.GROQ_API_KEY_1 đến 7)
        // Mình sẽ xuất ra cả 7 nhưng với trạng thái cho từng slot
        const totalSlots = 7;
        for (let i = 0; i < totalSlots; i++) {
            const k = process.env[`GROQ_API_KEY_${i + 1}`] || (i === 0 ? process.env.GROQ_API_KEY : '');
            const isActive = k && k.trim();
            
            // Nếu có thống kê thật từ API => dùng nó. Nếu không => mặc định limit 14400.
            const stats = groqKeyStats[i] || {
                remainingReqs: isActive ? 14400 : 0,
                limitReqs: isActive ? 14400 : 0,
                remainingTokens: isActive ? 100000 : 0,
                limitTokens: isActive ? 100000 : 0
            };
            
            statsArray.push({
                id: i + 1,
                maskedKey: isActive ? `${k.substring(0, 8)}********${k.substring(k.length - 4)}` : 'Chưa cấu hình (Not Configured)',
                status: isActive ? 'active' : 'inactive',
                remainingReqs: stats.remainingReqs,
                limitReqs: stats.limitReqs,
                remainingTokens: stats.remainingTokens,
                limitTokens: stats.limitTokens
            });
        }
        return statsArray;
    },

    chat: async (req, res) => {
        const { message, history } = req.body;
        const userId = req.user.id;
        
        try {
            const result = await aiController.processChat(userId, message, history);
            return res.json({ result });
        } catch (error) {
            console.error('AI Error:', error);
            const rawMessage = (error && error.message) ? error.message : '';

            let errorMessage = 'Bee lỗi rồi, thử lại nhé 🥰';
            if (rawMessage.includes('rate_limit_exceeded') || rawMessage.includes('429')) {
                errorMessage = 'Bee đang bận một chút do quá tải, bạn chờ vài giây rồi thử lại nhé 🥰🐝';
            } else if (rawMessage.includes('Chưa cấu hình GROQ_API_KEY')) {
                errorMessage = 'Bee AI chưa được cấu hình API key trên server. Vui lòng thêm GROQ_API_KEY (hoặc GROQ_API_KEY_1..7) ở Render 🐝';
            } else if (rawMessage.includes('invalid_api_key') || rawMessage.includes('Invalid API Key')) {
                errorMessage = 'GROQ API key hiện không hợp lệ. Vui lòng cập nhật lại key trên Render 🐝';
            }

            res.status(500).json({ message: errorMessage });
        }
    },

    getHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            const [rows] = await db.execute(
                'SELECT message, response, created_at FROM chat_logs WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
                [userId]
            );

            // Chuyển đổi format chat_logs sang chat history (user/assistant)
            const history = [];
            rows.forEach(row => {
                history.push({ role: 'user', content: row.message });
                history.push({ role: 'assistant', content: row.response });
            });

            res.json({ history });
        } catch (error) {
            console.error('Get AI History Error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy lịch sử chat.' });
        }
    },

    clearHistory: async (req, res) => {
        try {
            const userId = req.user.id;
            await db.execute('DELETE FROM chat_logs WHERE user_id = ?', [userId]);
            res.json({ message: 'Đã xóa lịch sử chat thành công!' });
        } catch (error) {
            console.error('Clear AI History Error:', error);
            res.status(500).json({ message: 'Lỗi khi xóa lịch sử chat.' });
        }
    },

    processChat: async (userId, message, history, platform = 'web') => {
        await ensureAiInfraReady();

        const now = new Date();
        const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
        const currentTime = now.toLocaleString('vi-VN', options);
        const dayOfWeek = now.toLocaleDateString('vi-VN', { ...options, weekday: 'long' });
        
        // 1. Fetch Dynamic System Prompt
        let dbPrompt = DEFAULT_SYSTEM_PROMPT;
        try {
            const [config] = await db.execute('SELECT value FROM system_config WHERE \`key\` = ?', ['ai_system_prompt']);
            if (config[0] && config[0].value) {
                dbPrompt = config[0].value;
            }
        } catch (promptError) {
            console.warn('[AI] Using default system prompt:', promptError.message);
        }

        let taskData = [], planData = [], habitData = [];
        const [t] = await db.execute('SELECT id, title, description, status, priority, due_date FROM tasks WHERE user_id = ? AND (status != "completed" OR created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) ORDER BY priority DESC, due_date ASC LIMIT 30', [userId]);
        const [p] = await db.execute('SELECT id, title, description, status, priority, start_time, end_time FROM plans WHERE user_id = ? AND (end_time >= DATE_SUB(NOW(), INTERVAL 6 HOUR)) ORDER BY start_time ASC LIMIT 30', [userId]);
        const [h] = await db.execute('SELECT id, title, description, frequency, goal, current_streak, last_completed FROM habits WHERE user_id = ? LIMIT 20', [userId]);
        
        taskData = t; planData = p; habitData = h;

        const formatContextDate = (date) => {
            if (!date) return 'N/A';
            const d = new Date(date);
            return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        };

        const tasksStr = taskData.map(t => `- **${t.title}** [id:${t.id}] (Hạn: ${formatContextDate(t.due_date)}, Trạng thái: ${t.status})`).join('\n');
        const plansStr = planData.map(p => `- **${p.title}** [id:${p.id}] (Bắt đầu: ${formatContextDate(p.start_time)}, Kết thúc: ${formatContextDate(p.end_time)}, Trạng thái: ${p.status})`).join('\n');
        const habitsStr = habitData.map(h => `- **${h.title}** (Tần suất: ${h.frequency}, Chuỗi: ${h.current_streak}, Hoàn thành gần nhất: ${formatContextDate(h.last_completed)})`).join('\n');

        const sanitizedHistory = (history || []).map(msg => ({
            role: (msg.role === 'bot' || msg.role === 'assistant') ? 'assistant' : 'user',
            content: msg.content
        })).filter(msg => msg.role !== 'system');

        const systemPrompt = `
${dbPrompt}

PHẠM VI TRẢ LỜI (BẮT BUỘC):
- Bạn chỉ thực hiện các nhiệm vụ: Lên lịch, quản lý task/habit, xem dữ liệu người dùng cung cấp bên dưới, và tư vấn về năng suất.
- Tuyệt đối KHÔNG trả lời các câu hỏi về kiến thức chung, triết học, giải toán, viết code, hoặc bất kỳ chủ đề nào không liên quan đến Plan-Bee.
- Nếu người dùng hỏi ngoài phạm vi, hãy trả lời: "Bee xin lỗi, Bee chỉ có thể hỗ trợ bạn các vấn đề về quản lý công việc và thói quen trên Plan-Bee thôi. Hãy để Bee giúp bạn lên lịch trình hôm nay nhé! 🐝" (hoặc văn phong tương tự).

DỮ LIỆU THỰC TẾ (CONTEXT):
- Thời gian: ${currentTime} (${dayOfWeek})
- Tasks:
${tasksStr || 'Trống'}
- Plans:
${plansStr || 'Trống'}
- Habits:
${habitsStr || 'Trống'}

LƯU Ý: Tuyệt đối bảo mật ID [id:...]. Bạn hiện đang sử dụng công cụ (tools) thay vì thẻ hành động trong text. Tuyệt đối không in ra các thẻ như [].
${platform === 'telegram' ? 'TRẢ LỜI TRÊN TELEGRAM: Hãy trả lời cực kỳ ngắn gọn, rõ ràng. Không dùng markdown quá phức tạp.' : ''}
`;

        const messages = [
            { role: "system", content: systemPrompt },
            ...sanitizedHistory,
            { role: "user", content: message }
        ];

        const tools = [
            {
                type: "function",
                function: {
                    name: "add_new_task",
                    description: "Add a task.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            due_date: { type: "string", description: "YYYY-MM-DD HH:MM:SS" }
                        },
                        required: ["title"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "add_new_plan",
                    description: "Add a calendar plan.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            start_time: { type: "string", description: "YYYY-MM-DD HH:MM:SS" },
                            end_time: { type: "string", description: "YYYY-MM-DD HH:MM:SS" },
                            color: { type: "string", description: "Hex color code" },
                            priority: { type: "string", enum: ["low", "medium", "high"] }
                        },
                        required: ["title", "start_time", "end_time"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_plan",
                    description: "Update details of an existing calendar plan (color, priority, time).",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Exact title of the plan to update" },
                            new_title: { type: "string" },
                            start_time: { type: "string", description: "YYYY-MM-DD HH:MM:SS" },
                            end_time: { type: "string", description: "YYYY-MM-DD HH:MM:SS" },
                            color: { type: "string", description: "Hex color code" },
                            priority: { type: "string", enum: ["low", "medium", "high"] }
                        },
                        required: ["title"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "add_new_habit",
                    description: "Add a habit.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            frequency: { type: "string", enum: ["daily", "weekly"] },
                            preferred_time: { type: "string", description: "HH:MM:SS format" }
                        },
                        required: ["title"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_task",
                    description: "Update details of an existing task (title, due_date, priority).",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string", description: "Exact title of the task to update" },
                            new_title: { type: "string" },
                            due_date: { type: "string", description: "YYYY-MM-DD HH:MM:SS" },
                            priority: { type: "string", enum: ["low", "medium", "high"] }
                        },
                        required: ["title"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "update_status",
                    description: "Update status of a task or plan.",
                    parameters: {
                        type: "object",
                        properties: {
                            title: { type: "string" },
                            status: { type: "string", enum: ["pending", "doing", "completed", "cancelled"] }
                        },
                        required: ["title", "status"]
                    }
                }
            },
            {
                type: "function",
                function: {
                    name: "delete_item",
                    description: "Delete an item.",
                    parameters: {
                        type: "object",
                        properties: { 
                            title: { type: "string" },
                            type: { type: "string", enum: ["task", "plan", "habit"] }
                        },
                        required: ["title"]
                    }
                }
            }
        ];

        // Làm sạch lịch sử: Đảm bảo không có tin nhắn tool lẻ loi hoặc assistant gọi tool mà không có kết quả
        // Điều này thường xảy ra khi frontend cắt (slice) lịch sử không đúng vị trí.
        const cleanedMessages = [];
        for (let i = 0; i < messages.length; i++) {
            const msg = messages[i];
            
            if (msg.role === 'tool') {
                // Kiểm tra xem tin nhắn trước đó có phải là assistant gọi tool này không
                const prev = cleanedMessages[cleanedMessages.length - 1];
                if (prev && prev.role === 'assistant' && prev.tool_calls) {
                    cleanedMessages.push(msg);
                } else {
                    console.warn('[AI] Orphaned tool message removed:', msg.tool_call_id);
                    continue; // Bỏ qua tin nhắn tool mồ côi
                }
            } else if (msg.role === 'assistant' && msg.tool_calls) {
                // Kiểm tra xem tin nhắn tiếp theo có phải là tool tương ứng không
                const next = messages[i + 1];
                if (next && next.role === 'tool') {
                    cleanedMessages.push(msg);
                } else {
                    console.warn('[AI] Tool-calling assistant message without results removed');
                    continue; // Bỏ qua vì không có kết quả tool đi kèm
                }
            } else {
                cleanedMessages.push(msg);
            }
        }

        try {
            const data = await fetchWithRotation({
                model: "llama-3.3-70b-versatile",
                messages: cleanedMessages, 
                tools, tool_choice: "auto", temperature: 0.1
            });

            if (data.error) {
                if (data.error.code === 'tool_use_failed') return data.failed_generation || "Bee đang gặp sự cố nhỏ...";
                throw new Error(JSON.stringify(data.error));
            }

            const messageObj = data.choices && data.choices[0] ? data.choices[0].message : null;
            if (!messageObj) {
                throw new Error('Phản hồi từ Groq không hợp lệ (không có message).');
            }

            let finalResponse = "";
            const actionTags = [];

            if (messageObj.tool_calls) {
                messages.push(messageObj);
                for (const toolCall of messageObj.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    let resTool = "";

                        if (toolCall.function.name === "add_new_task") {
                            const [result] = await db.execute('INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)', [userId, args.title, formatDateForMySQL(args.due_date)]);
                            await NotificationController.create(userId, `Ghi chú mới: "${args.title}"`, 'task', result.insertId);
                            
                            // Send Telegram notification if action was triggered from Web
                            if (platform === 'web') {
                                const date = new Date(args.due_date);
                                const dayStr = date.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                                const timeStr = `${date.getHours()}h${date.getMinutes().toString().padStart(2, '0')}`;
                                const tgMsg = `📋 *Nhiệm vụ mới qua AI!* 🐝\n\nNhiệm vụ: *"${args.title}"*\n⏰ Hạn chót: \`${timeStr}\` - _${dayStr}_\n\n_Bee đã ghi chú lại giúp bạn rồi nhé!_ ✨`;
                                sendSimpleMessage(userId, tgMsg).catch(e => console.error('AI Task TG notify error:', e));
                            }

                            resTool = "Success";
                        } else if (toolCall.function.name === "add_new_plan") {
                        const startDate = new Date(args.start_time);
                        const endDate = new Date(args.end_time);

                        if (!isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate) {
                            resTool = "Error: Invalid time range.";
                        } else {
                            const start = formatDateForMySQL(startDate);
                            const end = formatDateForMySQL(endDate);

                            let overlaps = [];
                            if (isShortPlanRange(startDate, endDate)) {
                                [overlaps] = await db.execute(
                                    'SELECT title FROM plans WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) < 86400 AND start_time < ? AND end_time > ? LIMIT 1',
                                    [userId, end, start]
                                );

                                if (overlaps.length === 0) {
                                    const [longPlans] = await db.execute(
                                        'SELECT id, title, start_time, end_time FROM plans WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) >= 86400 AND DATE(start_time) <= ? AND DATE(end_time) >= ?',
                                        [userId, toPlanDate(end), toPlanDate(start)]
                                    );

                                    const conflict = findLongPlanDailyConflict({
                                        candidateStart: start,
                                        candidateEnd: end,
                                        longPlans
                                    });

                                    if (conflict) {
                                        overlaps = [{ title: conflict.title }];
                                    }
                                }
                            }

                            if (overlaps.length > 0) {
                                resTool = `Error: Overlap with "${overlaps[0].title}".`;
                            } else {
                                const [usedColorRows] = await db.execute(
                                    'SELECT color FROM plans WHERE user_id = ? AND color IS NOT NULL',
                                    [userId]
                                );
                                const normalizedColor = pickUniquePlanColor(
                                    usedColorRows.map((row) => row.color),
                                    args.color
                                );

                                const [result] = await db.execute('INSERT INTO plans (user_id, title, start_time, end_time, color, priority) VALUES (?, ?, ?, ?, ?, ?)', [userId, args.title, start, end, normalizedColor, args.priority || 'medium']);
                                await NotificationController.create(userId, `Lập kế hoạch: "${args.title}"`, 'plan', result.insertId);
                                
                                // Send Telegram notification if action was triggered from Web
                                if (platform === 'web') {
                                    const s = new Date(start);
                                    const e = new Date(end);
                                    const dayStr = s.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                                    const timeRange = `${s.getHours()}h${s.getMinutes().toString().padStart(2, '0')}-${e.getHours()}h${e.getMinutes().toString().padStart(2, '0')}`;
                                    const tgMsg = `*Thông báo lịch mới qua AI!* 🐝\n\nBạn vừa thêm lịch: *"${args.title}"*\n📍 Thời gian: \`${timeRange}\`\n🗓️ Ngày: _${dayStr}_ \n\n_Hãy chuẩn bị thật tốt nhé!_ ✨`;
                                    sendSimpleMessage(userId, tgMsg).catch(err => console.error('AI Plan TG notify error:', err));
                                }

                                resTool = "Success";

                                if (platform === 'web') {
                                    actionTags.push(makeActionTag('view_plan', {
                                        id: result.insertId,
                                        title: args.title,
                                        date: toPlanDate(start),
                                        time: toPlanTime(start),
                                        start_time: start,
                                        end_time: end,
                                        color: normalizedColor,
                                        view: 'day'
                                    }));
                                }
                            }
                        }
                    } else if (toolCall.function.name === "update_plan") {
                        const title = (args.title || "").trim();
                        // Find the plan first
                        const [plans] = await db.execute(
                            'SELECT * FROM plans WHERE user_id = ? AND title = ? ORDER BY start_time DESC LIMIT 1',
                            [userId, title]
                        );

                        if (plans.length === 0) {
                            resTool = "Plan not found.";
                        } else {
                            const plan = plans[0];
                            const fields = [];
                            const params = [];

                            if (args.new_title) { fields.push('title = ?'); params.push(args.new_title); }
                            if (args.start_time) { fields.push('start_time = ?'); params.push(formatDateForMySQL(args.start_time)); }
                            if (args.end_time) { fields.push('end_time = ?'); params.push(formatDateForMySQL(args.end_time)); }
                            if (args.color) { fields.push('color = ?'); params.push(args.color); }
                            if (args.priority) { fields.push('priority = ?'); params.push(args.priority); }

                            if (fields.length > 0) {
                                params.push(plan.id);
                                
                                // Normalize color if provided
                                if (args.color) {
                                    const [usedCols] = await db.execute('SELECT color FROM plans WHERE user_id = ? AND id != ?', [userId, plan.id]);
                                    const normColor = pickUniquePlanColor(usedCols.map(r => r.color), args.color);
                                    // Update the param in the right position
                                    const colorIndex = fields.findIndex(f => f.startsWith('color'));
                                    if (colorIndex !== -1) params[colorIndex] = normColor;
                                }

                                await db.execute(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, params);
                                resTool = "Updated plan successfully.";

                                if (platform === 'web') {
                                    actionTags.push(makeActionTag('view_plan', {
                                        id: plan.id,
                                        title: args.new_title || plan.title,
                                        start_time: args.start_time ? formatDateForMySQL(args.start_time) : plan.start_time,
                                        end_time: args.end_time ? formatDateForMySQL(args.end_time) : plan.end_time,
                                        color: args.color || plan.color,
                                        priority: args.priority || plan.priority,
                                        view: 'day'
                                    }));
                                }
                            } else {
                                resTool = "No changes requested for plan.";
                            }
                        }
                    } else if (toolCall.function.name === "update_task") {
                        const title = (args.title || "").trim();
                        const [tasks] = await db.execute('SELECT * FROM tasks WHERE user_id = ? AND title = ? LIMIT 1', [userId, title]);
                        
                        if (tasks.length === 0) {
                            resTool = "Task not found.";
                        } else {
                            const task = tasks[0];
                            const fields = [];
                            const params = [];

                            if (args.new_title) { fields.push('title = ?'); params.push(args.new_title); }
                            if (args.due_date) { fields.push('due_date = ?'); params.push(formatDateForMySQL(args.due_date)); }
                            if (args.priority) { fields.push('priority = ?'); params.push(args.priority); }

                            if (fields.length > 0) {
                                params.push(task.id);
                                await db.execute(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`, params);
                                resTool = "Updated task successfully.";
                                
                                if (platform === 'web') {
                                    actionTags.push(makeActionTag('view_task', {
                                        id: task.id,
                                        title: args.new_title || task.title,
                                        due_date: args.due_date ? formatDateForMySQL(args.due_date) : task.due_date,
                                        priority: args.priority || task.priority
                                    }));
                                }
                            } else {
                                resTool = "No changes requested for task.";
                            }
                        }
                    } else if (toolCall.function.name === "add_new_habit") {
                        await db.execute('INSERT INTO habits (user_id, title, description, frequency, preferred_time) VALUES (?, ?, ?, ?, ?)', [userId, args.title, args.description || '', args.frequency || 'daily', args.preferred_time || null]);
                        resTool = "Success";

                        if (platform === 'web') {
                            actionTags.push(makeActionTag('view_habit', {
                                title: args.title
                            }));
                        }
                    } else if (toolCall.function.name === "update_status") {
                        const title = (args.title || "").trim();
                        const [upT] = await db.execute('UPDATE tasks SET status = ? WHERE user_id = ? AND title = ?', [args.status, userId, title]);
                        if (upT.affectedRows > 0) resTool = "Updated task successfully";
                        else {
                            const [upP] = await db.execute('UPDATE plans SET status = ? WHERE user_id = ? AND title = ?', [args.status, userId, title]);
                            resTool = upP.affectedRows > 0 ? "Updated plan successfully" : "Not found.";
                        }
                    } else if (toolCall.function.name === "delete_item") {
                        const title = (args.title || "").trim();
                        if (args.type === "task") await db.execute('DELETE FROM tasks WHERE user_id = ? AND title = ?', [userId, title]);
                        else if (args.type === "plan") {
                            const [planRows] = await db.execute(
                                'SELECT id, title, start_time, end_time, color FROM plans WHERE user_id = ? AND title = ? ORDER BY start_time DESC LIMIT 1',
                                [userId, title]
                            );

                            if (planRows.length === 0) {
                                resTool = "Not found.";
                            } else {
                                const plan = planRows[0];
                                await db.execute('DELETE FROM plans WHERE id = ? AND user_id = ?', [plan.id, userId]);
                                resTool = "Success";

                                if (platform === 'web') {
                                    actionTags.push(makeActionTag('delete_plan', {
                                        id: plan.id,
                                        title: plan.title,
                                        date: toPlanDate(plan.start_time),
                                        time: toPlanTime(plan.start_time),
                                        start_time: plan.start_time,
                                        end_time: plan.end_time,
                                        color: plan.color || '#FF5252',
                                        view: 'day'
                                    }));
                                }
                            }
                        } else if (args.type === "habit") {
                            await db.execute('DELETE FROM habits WHERE user_id = ? AND title = ?', [userId, title]);
                            resTool = "Success";
                        } else {
                            resTool = "Not found.";
                        }
                    }
                    messages.push({ tool_call_id: toolCall.id, role: "tool", name: toolCall.function.name, content: resTool });
                }

                const secondaryData = await fetchWithRotation({ model: "llama-3.3-70b-versatile", messages });
                if (secondaryData && secondaryData.choices && secondaryData.choices[0] && secondaryData.choices[0].message) {
                    finalResponse = secondaryData.choices[0].message.content || "";
                }
            } else {
                finalResponse = messageObj.content || "";
            }

            // Dọn dẹp lỗi output dư thừa (nếu có)
            if (finalResponse) {
                finalResponse = finalResponse.replace(/\[\]/g, '').trim();
            }

            if (platform === 'web' && actionTags.length > 0) {
                const baseText = finalResponse && finalResponse.trim() ? finalResponse.trim() : 'Bee đã thực hiện xong yêu cầu của bạn rồi nhé! ✨';
                finalResponse = `${baseText}\n${actionTags.join('\n')}`;
            }

            // Fallback cuối cùng nếu vẫn trống
            if (!finalResponse || finalResponse.trim() === "") {
                finalResponse = "Bee đã thực hiện xong rồi nè! Có gì cần Bee hỗ trợ tiếp không bạn? 🐝✨";
            }

            // 2. LOG CHAT (Non-blocking to prevent congestion)
            db.execute(
                'INSERT INTO chat_logs (user_id, message, response, tokens_used) VALUES (?, ?, ?, ?)',
                [userId, message, finalResponse, data.usage?.total_tokens || 0]
            ).catch(logError => console.warn('[AI] Skip chat_logs insert:', logError.message));

            return finalResponse;
        } catch (error) {
            // 3. LOG ERROR
            try {
                await db.execute('INSERT INTO error_logs (error_message, stack_trace) VALUES (?, ?)', [error.message, error.stack]);
            } catch (logError) {
                console.warn('[AI] Skip error_logs insert:', logError.message);
            }
            throw error;
        }
    }
};

module.exports = aiController;

