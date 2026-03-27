const db = require('../config/db');
const { formatDateForMySQL } = require('../utils/dateFormatter');

const aiController = {
    chat: async (req, res) => {
        const { message, history } = req.body;
        const userId = req.user.id;
        const groqApiKey = process.env.GROQ_API_KEY;

        if (!groqApiKey) {
            return res.status(500).json({ message: "GROQ_API_KEY missing." });
        }

        try {
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

            const tasksStr = taskData.map(t => `- **${t.title}** [id:${t.id}] (Ưu tiên: ${t.priority}, Hạn: ${t.due_date}, Trạng thái: ${t.status})`).join('\n');
            const plansStr = planData.map(p => `- **${p.title}** [id:${p.id}] (Bắt đầu: ${p.start_time}, Kết thúc: ${p.end_time}, Trạng thái: ${p.status})`).join('\n');
            const habitsStr = habitData.map(h => `- **${h.title}** (Tần suất: ${h.frequency}, Chuỗi: ${h.current_streak}, Hoàn thành gần nhất: ${h.last_completed})`).join('\n');

            // SANITIZE HISTORY
            const sanitizedHistory = (history || []).map(msg => ({
                role: (msg.role === 'bot' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: msg.content
            })).filter(msg => msg.role !== 'system');

            const systemPrompt = `
Bạn là Bee - Trợ lý AI chuyên nghiệp và tận tâm của PlanBee. 🥰🐝

NHIỆM VỤ: Phân tích và gợi ý lịch trình thông minh (RAG).

QUY TẮC PHẢN HỒI (BẮT BUỘC):
1. **Gọn gàng & Phân ý**: Không viết đoạn văn dài. Hãy dùng danh sách dấu chấm tròn hoặc số thứ tự.
2. **Trực diện**: Trả lời thẳng vào vấn đề. 
3. **Phân tích RAG**:
   - Ưu tiên Task **High Priority** và deadline gần.
   - Chỉ ra các khoảng trống trong "Kế hoạch" để gợi ý việc nên làm.
   - Nhắc nhở Thói quen chưa hoàn thành.
4. **Định dạng**:
   - **BÔI ĐẬM** tên công việc và mốc thời gian.
   - Sử dụng emoji để tăng tính trực quan (⏰, 🎯, 📚, ✨).
5. **Cấu trúc gợi ý lý tưởng**:
   - 📅 **Phân tích hiện tại**: (Ngắn gọn tình hình)
   - 🚀 **Hành động ưu tiên**: (Việc cần làm ngay)
   - 💡 **Gợi ý thêm**: (Tối ưu thời gian rảnh/Thói quen)

**HÀNH ĐỘNG KỸ THUẬT** (Luôn đặt ở cuối):
- [view_plan:title=...&date=YYYY-MM-DD&time=HH:00] -> Dùng khi tạo/cập nhật thành công.
- [delete_plan:id=...&title=...] -> Dùng khi xóa thành công.

DỮ LIỆU THỰC TẾ (CONTEXT):
- Thời gian: ${currentTime} (${dayOfWeek})
- Tasks:
${tasksStr || 'Trống'}
- Plans:
${plansStr || 'Trống'}
- Habits:
${habitsStr || 'Trống'}

LƯU Ý: Tuyệt đối bảo mật ID [id:...]. Thẻ hành động [] luôn đặt ở CUỐI CÙNG.
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
                                type: { type: "string", enum: ["task", "plan"] }
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
            if (data.error) throw new Error(JSON.stringify(data.error));

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
                        resTool = "Success";
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
                
                return res.json({ result: fD.choices[0].message.content });
            }

            return res.json({ result: messageObj.content || "Bee chào bạn 🥰" });

        } catch (error) {
            console.error('AI Error:', error);
            const errorMessage = error.message.includes('rate_limit_exceeded') 
                ? "Bee đang bận một chút do quá tải, bạn chờ vài giây rồi thử lại nhé 🥰🐝" 
                : "Bee lỗi rồi, thử lại nhé 🥰";
            res.status(500).json({ message: errorMessage });
        }
    }
};

module.exports = aiController;
