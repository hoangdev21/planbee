const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');

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
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            throw new Error("GROQ_API_KEY missing.");
        }

        const now = new Date();
        const options = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
        const currentTime = now.toLocaleString('vi-VN', options);
        const dayOfWeek = now.toLocaleDateString('vi-VN', { ...options, weekday: 'long' });
        
        let taskData = [], planData = [], habitData = [];
        
        // INDEPENDENT FETCH: Ensure AI always has data
        const [t] = await db.execute('SELECT id, title, description, status, priority, due_date FROM tasks WHERE user_id = ? AND (status != "completed" OR created_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)) ORDER BY priority DESC, due_date ASC LIMIT 30', [userId]);
        const [p] = await db.execute('SELECT id, title, description, status, priority, start_time, end_time FROM plans WHERE user_id = ? AND (end_time >= DATE_SUB(NOW(), INTERVAL 6 HOUR)) ORDER BY start_time ASC LIMIT 30', [userId]);
        const [h] = await db.execute('SELECT id, title, description, frequency, goal, current_streak, last_completed FROM habits WHERE user_id = ? LIMIT 20', [userId]);
        
        taskData = t; planData = p; habitData = h;

        const formatContextDate = (date) => {
            if (!date) return 'N/A';
            const d = new Date(date);
            return d.toLocaleString('vi-VN', { 
                timeZone: 'Asia/Ho_Chi_Minh', 
                weekday: 'long', 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
        };

        const tasksStr = taskData.map(t => `- **${t.title}** [id:${t.id}] (Hạn: ${formatContextDate(t.due_date)}, Trạng thái: ${t.status})`).join('\n');
        const plansStr = planData.map(p => `- **${p.title}** [id:${p.id}] (Bắt đầu: ${formatContextDate(p.start_time)}, Kết thúc: ${formatContextDate(p.end_time)}, Trạng thái: ${p.status})`).join('\n');
        const habitsStr = habitData.map(h => `- **${h.title}** (Tần suất: ${h.frequency}, Chuỗi: ${h.current_streak}, Hoàn thành gần nhất: ${formatContextDate(h.last_completed)})`).join('\n');

        // SANITIZE HISTORY
        const sanitizedHistory = (history || []).map(msg => ({
            role: (msg.role === 'bot' || msg.role === 'assistant') ? 'assistant' : 'user',
            content: msg.content
        })).filter(msg => msg.role !== 'system');

        const systemPrompt = `
Bạn là Bee - Trợ lý AI thông minh, nhiệt huyết và cực kỳ tâm lý của PlanBee. 🐝✨

NHIỆM VỤ: Giúp người dùng quản lý thời gian hiệu quả, xây dựng kỷ luật và duy trì thói quen tích cực.

PHONG CÁCH PHẢN HỒI (QUY TẮC CỨNG):
1. **Dành cho Lời chào/Trò chuyện**: Nếu người dùng chỉ chào hỏi (Hi, Hello, Chào,...) hãy chào lại một cách nồng nhiệt, vui vẻ và thân thiện. KHÔNG liệt kê task, KHÔNG phân tích dữ liệu và KHÔNG hiển thị thẻ hành động []. Chỉ trả lời tự nhiên như một người bạn. 🥰
2. **Dành cho Phân tích/Gợi ý (RAG)**: Chỉ thực hiện khi được hỏi cụ thể (Ví dụ: "Tôi nên làm gì?", "Gợi ý lịch trình", "Phân tích giúp tôi",...). Khi đó hãy dùng dữ liệu CONTEXT để tư vấn chuyên sâu.
3. **Quy tắc Thẻ hành động kỹ thuật []**: 
   - TUYỆT ĐỐI KHÔNG tự ý hiển thị thẻ [] nếu bạn chưa thực hiện thành công một tool call (Thêm/Xóa/Sửa).
   - KHÔNG sử dụng Tool để tạo task/plan cho các bản tóm tắt hoặc phân tích dữ liệu. Tool chỉ dành cho các yêu cầu thực tế (Ví dụ: "Thêm lịch...", "Xóa...").
   - Nếu gọi tool thành công, chỉ hiển thị DUY NHẤT 01 thẻ ở cuối cùng của câu trả lời.
   - Tuyệt đối không bao giờ hiển thị thẻ hành động trong một cuộc hội thoại chào hỏi thông thường.

CẤU TRÚC PHẢN HỒI RAG (CHỈ KHI ĐƯỢC YÊU CẦU):
- Phân tích: Task nào đang trễ? Task nào cần làm ngay? 📊
- Chiến thuật: Gợi ý sắp xếp thời gian hợp lý dựa trên Context bên dưới. 🚀
- Thiết kế Bản tóm tắt/Thống kê (Nếu được hỏi): 
  + Luôn sử dụng khối mã (Code Block: \` \` \` ) để bao bọc toàn bộ danh sách lịch. Điều này tạo ra một "thẻ" (card) có khung viền và bo góc đẹp mắt trên cả Web và Telegram.
  + Cấu trúc bên trong khung:
    * Dùng CHỮ IN HOA cho tên thứ (ví dụ: THỨ 2:, THỨ 3:...) để làm nổi bật thay cho bôi đậm (vì khối mã không hỗ trợ bôi đậm).
    * Sử dụng dấu gạch đầu dòng (-) cho từng sự kiện.
    * Thêm 01 dòng trống giữa các ngày để dễ nhìn.
  + Lời chào và lời kết nằm ngoài khối mã để tạo sự thân thiện.
- Khích lệ: Nhắc nhở thói quen và duy trì chuỗi (streak). 🌿

HÀNH ĐỘNG KỸ THUẬT:
- [view_plan:title=...&date=YYYY-MM-DD&time=HH:00] -> Chỉ dùng khi tạo/cập nhật thành công plan.
- [delete_plan:id=...&title=...&date=YYYY-MM-DD&time=HH:MM&view=day] -> Dùng khi xóa thành công một plan.
- [view_habit:title=...] -> Chỉ dùng khi tạo thành công thói quen.

DỮ LIỆU THỰC TẾ (CONTEXT):
- Thời gian: ${currentTime} (${dayOfWeek})
- Tasks:
${tasksStr || 'Trống'}
- Plans:
${plansStr || 'Trống'}
- Habits:
${habitsStr || 'Trống'}

LƯU Ý: Tuyệt đối bảo mật ID [id:...]. Thẻ hành động [] (nếu có) luôn xếp ở cuối cùng sau lời chào/xác nhận.
${platform === 'telegram' ? 'TRẢ LỜI TRÊN TELEGRAM: Hãy trả lời cực kỳ ngắn gọn, rõ ràng. Không dùng markdown quá phức tạp. Tập trung vào việc xác nhận hành động thành công.' : ''}
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
                            status: { type: "string", enum: ["pending", "doing", "completed", "cancelled"] },
                            datehint: { type: "string" }
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

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages, tools, tool_choice: "auto", temperature: 0.1
            })
        });

        const data = await response.json();
        if (data.error) {
            console.error('Groq API Error:', data.error);
            if (data.error.code === 'tool_use_failed') {
                // Fallback to text-only if tool call failed
                return data.failed_generation || "Bee đang gặp một chút vấn đề khi xử lý hành động này, nhưng đây là thông tin bạn cần. 🥰";
            }
            throw new Error(JSON.stringify(data.error));
        }

        const messageObj = data.choices[0].message;

        if (messageObj.tool_calls) {
            messages.push(messageObj);
            
            for (const toolCall of messageObj.tool_calls) {
                const args = JSON.parse(toolCall.function.arguments);
                let resTool = "";

                if (toolCall.function.name === "add_new_task") {
                    await db.execute('INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)', 
                        [userId, args.title, formatDateForMySQL(args.due_date)]);
                    resTool = "Success";
                } else if (toolCall.function.name === "add_new_plan") {
                    const start = formatDateForMySQL(args.start_time);
                    const end = formatDateForMySQL(args.end_time);
                    const [overlaps] = await db.execute(
                        'SELECT title FROM plans WHERE user_id = ? AND start_time < ? AND end_time > ?',
                        [userId, end, start]
                    );
                    if (overlaps.length > 0) {
                        resTool = `Error: Overlap with "${overlaps[0].title}".`;
                    } else {
                        const colors = ['#2196F3', '#4CAF50', '#9C27B0', '#E91E63', '#009688', '#FF9800'];
                        const color = args.color || colors[Math.floor(Math.random() * colors.length)];
                        await db.execute('INSERT INTO plans (user_id, title, start_time, end_time, color) VALUES (?, ?, ?, ?, ?)', 
                            [userId, args.title, start, end, color]);
                        resTool = "Success";
                    }
                } else if (toolCall.function.name === "add_new_habit") {
                    await db.execute(
                        'INSERT INTO habits (user_id, title, description, frequency, preferred_time) VALUES (?, ?, ?, ?, ?)',
                        [userId, args.title, args.description || '', args.frequency || 'daily', args.preferred_time || null]
                    );
                    resTool = "Success";
                } else if (toolCall.function.name === "update_status") {
                    const title = (args.title || "").trim();
                    const [upT] = await db.execute('UPDATE tasks SET status = ? WHERE user_id = ? AND title = ?', [args.status, userId, title]);
                    if (upT.affectedRows > 0) {
                        resTool = "Updated task successfully";
                    } else {
                        const [upP] = await db.execute('UPDATE plans SET status = ? WHERE user_id = ? AND title = ?', [args.status, userId, title]);
                        resTool = upP.affectedRows > 0 ? "Updated plan successfully" : "Not found.";
                    }
                } else if (toolCall.function.name === "delete_item") {
                    const title = (args.title || "").trim();
                    let deletedItem = null;
                    if (args.type === "task") {
                        const [rows] = await db.execute('SELECT id, title, due_date FROM tasks WHERE user_id = ? AND title = ?', [userId, title]);
                        if (rows[0]) {
                            deletedItem = rows[0];
                            await db.execute('DELETE FROM tasks WHERE id = ?', [rows[0].id]);
                        }
                    } else if (args.type === "plan") {
                        const [rows] = await db.execute('SELECT id, title, start_time FROM plans WHERE user_id = ? AND title = ?', [userId, title]);
                        if (rows[0]) {
                            deletedItem = rows[0];
                            await db.execute('DELETE FROM plans WHERE id = ?', [rows[0].id]);
                        }
                    } else if (args.type === "habit") {
                        const [rows] = await db.execute('SELECT id, title FROM habits WHERE user_id = ? AND title = ?', [userId, title]);
                        if (rows[0]) {
                            deletedItem = rows[0];
                            await db.execute('DELETE FROM habits WHERE id = ?', [rows[0].id]);
                        }
                    }
                    resTool = deletedItem ? `Success: Item ${deletedItem.id} ("${deletedItem.title}") has been deleted.` : "Error: Item not found.";
                }
                messages.push({ tool_call_id: toolCall.id, role: "tool", name: toolCall.function.name, content: resTool });
            }

            const sR = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
            });
            const fD = await sR.json();
            if (fD.error) throw new Error(JSON.stringify(fD.error));
            if (!fD.choices || !fD.choices[0]) throw new Error("API returned no choices");
            
            return fD.choices[0].message.content;
        }

        return messageObj.content || "Bee chào bạn 🥰";
    }
};

module.exports = aiController;
