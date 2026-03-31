const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');
const NotificationController = require('./notificationController');
const { sendSimpleMessage } = require('../services/telegramSender');

// Cấu hình nhiều API Key để xoay vòng khi hết lượt (Rate Limit)
const groqKeys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
    process.env.GROQ_API_KEY_4,
    process.env.GROQ_API_KEY_5,
    process.env.GROQ_API_KEY_6,
    process.env.GROQ_API_KEY_7
].filter(k => k && k.trim() !== '');

let currentKeyIndex = 0;

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
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${key}`, 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify(body)
            });

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
    chat: async (req, res) => {
        const { message, history } = req.body;
        const userId = req.user.id;
        
        try {
            const result = await aiController.processChat(userId, message, history);
            return res.json({ result });
        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage = error.message.includes('rate_limit_exceeded') 
                ? "Bee đang bận một chút do quá tải, bạn chờ vài giây rồi thử lại nhé 🥰🐝" 
                : "Bee lỗi rồi, thử lại nhé 🥰";
            res.status(500).json({ message: errorMessage });
        }
    },

    processChat: async (userId, message, history, platform = 'web') => {
        const now = new Date();
        const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
        const currentTime = now.toLocaleString('vi-VN', options);
        const dayOfWeek = now.toLocaleDateString('vi-VN', { ...options, weekday: 'long' });
        
        // 1. Fetch Dynamic System Prompt
        const [config] = await db.execute('SELECT value FROM system_config WHERE \`key\` = ?', ['ai_system_prompt']);
        let dbPrompt = config[0] ? config[0].value : "Bạn là Bee - Trợ lý AI.";

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

DỮ LIỆU THỰC TẾ (CONTEXT):
- Thời gian: ${currentTime} (${dayOfWeek})
- Tasks:
${tasksStr || 'Trống'}
- Plans:
${plansStr || 'Trống'}
- Habits:
${habitsStr || 'Trống'}

LƯU Ý: Tuyệt đối bảo mật ID [id:...]. Thẻ hành động [] (nếu có) luôn xếp ở cuối cùng sau lời chào/xác nhận.
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
                            color: { type: "string", description: "Hex color code" }
                        },
                        required: ["title", "start_time", "end_time"]
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

        try {
            const data = await fetchWithRotation({
                model: "llama-3.3-70b-versatile",
                messages, tools, tool_choice: "auto", temperature: 0.1
            });

            if (data.error) {
                if (data.error.code === 'tool_use_failed') return data.failed_generation || "Bee đang gặp sự cố nhỏ...";
                throw new Error(JSON.stringify(data.error));
            }

            const messageObj = data.choices[0].message;
            let finalResponse = "";

            if (messageObj.tool_calls) {
                messages.push(messageObj);
                for (const toolCall of messageObj.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);
                    let resTool = "";

                    if (toolCall.function.name === "add_new_task") {
                        const [result] = await db.execute('INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)', [userId, args.title, formatDateForMySQL(args.due_date)]);
                        await NotificationController.create(userId, `Ghi chú mới: "${args.title}"`, 'task', result.insertId);
                        resTool = "Success";
                    } else if (toolCall.function.name === "add_new_plan") {
                        const start = formatDateForMySQL(args.start_time);
                        const end = formatDateForMySQL(args.end_time);
                        const [overlaps] = await db.execute('SELECT title FROM plans WHERE user_id = ? AND start_time < ? AND end_time > ?', [userId, end, start]);
                        if (overlaps.length > 0) {
                            resTool = `Error: Overlap with "${overlaps[0].title}".`;
                        } else {
                            const [result] = await db.execute('INSERT INTO plans (user_id, title, start_time, end_time, color) VALUES (?, ?, ?, ?, ?)', [userId, args.title, start, end, args.color || '#2196F3']);
                            await NotificationController.create(userId, `Lập kế hoạch: "${args.title}"`, 'plan', result.insertId);
                            resTool = "Success";
                        }
                    } else if (toolCall.function.name === "add_new_habit") {
                        await db.execute('INSERT INTO habits (user_id, title, description, frequency, preferred_time) VALUES (?, ?, ?, ?, ?)', [userId, args.title, args.description || '', args.frequency || 'daily', args.preferred_time || null]);
                        resTool = "Success";
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
                        else if (args.type === "plan") await db.execute('DELETE FROM plans WHERE user_id = ? AND title = ?', [userId, title]);
                        else if (args.type === "habit") await db.execute('DELETE FROM habits WHERE user_id = ? AND title = ?', [userId, title]);
                        resTool = "Success";
                    }
                    messages.push({ tool_call_id: toolCall.id, role: "tool", name: toolCall.function.name, content: resTool });
                }

                const secondaryData = await fetchWithRotation({ model: "llama-3.3-70b-versatile", messages });
                finalResponse = secondaryData.choices[0].message.content;
            } else {
                finalResponse = messageObj.content;
            }

            // 2. LOG CHAT
            await db.execute('INSERT INTO chat_logs (user_id, message, response, tokens_used) VALUES (?, ?, ?, ?)', [userId, message, finalResponse, data.usage?.total_tokens || 0]);

            return finalResponse;
        } catch (error) {
            // 3. LOG ERROR
            await db.execute('INSERT INTO error_logs (error_message, stack_trace) VALUES (?, ?)', [error.message, error.stack]);
            throw error;
        }
    }
};

module.exports = aiController;

