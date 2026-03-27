const db = require('../config/db');

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
            const currentTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
            
            let taskData = [], planData = [];
            try {
                // DEFENSIVE SCHEMA CHECK: Always ensure table is ready
                const [cols] = await db.execute("SHOW COLUMNS FROM plans");
                const hasS = cols.some(c => c.Field === 'status');
                const hasP = cols.some(c => c.Field === 'priority');
                if (!hasS) await db.execute("ALTER TABLE plans ADD COLUMN status VARCHAR(20) DEFAULT 'pending'");
                if (!hasP) await db.execute("ALTER TABLE plans ADD COLUMN priority VARCHAR(20) DEFAULT 'medium'");
            } catch (err) {
                console.error("Migration Silence:", err.message);
            }

            // INDEPENDENT FETCH: Ensure AI always has data even if migration fails
            const [t] = await db.execute('SELECT id, title, description, status, priority, due_date FROM tasks WHERE user_id = ? ORDER BY due_date ASC LIMIT 20', [userId]);
            const [p] = await db.execute('SELECT id, title, description, status, priority, start_time, end_time FROM plans WHERE user_id = ? ORDER BY start_time ASC LIMIT 20', [userId]);
            taskData = t; planData = p;

            const tasksStr = taskData.map(t => `${t.title} [id:${t.id}] (${t.status}, Hạn: ${t.due_date})`).join('; ');
            const plansStr = planData.map(p => `${p.title} [id:${p.id}] (${p.status}, Bắt đầu: ${p.start_time})`).join('; ');

            // SANITIZE HISTORY: Force all roles to be compliant with Groq/OpenAI
            const sanitizedHistory = (history || []).map(msg => ({
                role: (msg.role === 'bot' || msg.role === 'assistant') ? 'assistant' : 'user',
                content: msg.content
            })).filter(msg => msg.role !== 'system');

const systemPrompt = `
Bạn là Bee - Trợ lý AI chuyên nghiệp, tận tâm và thân thiện của ứng dụng PlanBee. 🥰🐝

NHIỆM VỤ CHÍNH:
- Giúp người dùng quản lý Nhiệm vụ (Tasks) và Lịch trình (Plans).
- Trò chuyện, giải đáp thắc mắc và hỗ trợ tối ưu hóa thời gian.

PHONG CÁCH PHẢN HỒI (PROFESSIONAL & ELEGANT):
1. TRÒ CHUYỆN: Khi người dùng chào hỏi hoặc nói chuyện bâng quơ, hãy đáp lại một cách tự nhiên, lịch sự và ấm áp. KHÔNG hiển thị danh sách hay nút bấm thừa thãi trong trường hợp này.
2. DANH SÁCH & ĐỊNH DẠNG:
   - KHÔNG dùng dấu gạch ngang "-" ở đầu câu nếu chỉ có 1 nội dung.
   - Chỉ dùng dấu "-" khi liệt kê từ 2 mục trở lên.
   - Luôn **BÔI ĐẬM** các từ khóa, tiêu đề quan trọng. Mẫu: **Tiêu đề** ⏰ Giờ 📍 Mô tả 🥰
3. THẺ HÀNH ĐỘNG (QUAN TRỌNG):
   - CHỈ đính kèm thẻ [] khi bạn vừa thực hiện THÀNH CÔNG một thao tác (Thêm/Xóa/Sửa).
   - [view_plan:view=week&date=YYYY-MM-DD&time=HH:00&title=...] -> Dùng khi thêm/cập nhật lịch thành công.
   - [delete_plan:id=...&view=week&date=YYYY-MM-DD&time=HH:00&title=...] -> Dùng khi xác nhận xóa.
   - Tuyệt đối KHÔNG tự ý chèn thẻ [] vào các câu chào hỏi hoặc báo rà soát danh sách thông thường.
   - Thẻ hành động phải là nội dung CUỐI CÙNG của tin nhắn.

DỮ LIỆU HIỆN TẠI (Để tham khảo khi được hỏi):
Thời gian: ${currentTime}
Nhiệm vụ: ${tasksStr}
Kế hoạch: ${plansStr}

LƯU Ý: Tuyệt đối bảo mật ID kỹ thuật [id:...], không được lộ ra ngoài câu trả lời.
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
                                end_time: { type: "string", description: "YYYY-MM-DD HH:MM:SS" }
                            },
                            required: ["title", "start_time", "end_time"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_task_status",
                        description: "Update status of a task (e.g. to 'completed' or 'cancelled').",
                        parameters: {
                            type: "object",
                            properties: {
                                title: { type: "string", description: "Title of task" },
                                status: { type: "string", enum: ["pending", "doing", "completed", "cancelled"] },
                                datehint: { type: "string", description: "Optional date hint like '2026-03-28' to disambiguate" }
                            },
                            required: ["title", "status"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "update_plan_status",
                        description: "Update status of a plan.",
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
                        name: "delete_task",
                        description: "Delete an existing task.",
                        parameters: {
                            type: "object",
                            properties: { title: { type: "string" } },
                            required: ["title"]
                        }
                    }
                },
                {
                    type: "function",
                    function: {
                        name: "delete_plan",
                        description: "Delete an existing plan.",
                        parameters: {
                            type: "object",
                            properties: { title: { type: "string" } },
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
                    messages, tools, tool_choice: "auto", temperature: 0
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
                        await db.execute('INSERT INTO tasks (user_id, title, due_date) VALUES (?, ?, ?)', [userId, args.title, args.due_date || null]);
                        resTool = "Success";
                    } else if (toolCall.function.name === "add_new_plan") {
                        // Conflict check
                        const [overlaps] = await db.execute(
                            'SELECT title FROM plans WHERE user_id = ? AND start_time < ? AND end_time > ?',
                            [userId, args.end_time, args.start_time]
                        );
                        if (overlaps.length > 0) {
                            resTool = `Error: Overlap detected with existing plan "${overlaps[0].title}". Do not add. Inform the user about this conflict specifically.`;
                        } else {
                            await db.execute('INSERT INTO plans (user_id, title, start_time, end_time) VALUES (?, ?, ?, ?)', [userId, args.title, args.start_time, args.end_time]);
                            resTool = "Success";
                        }
                    } else if (toolCall.function.name === "update_task_status") {
                        let q = 'UPDATE tasks SET status = ? WHERE user_id = ? AND title = ?';
                        let params = [args.status, userId, args.title];
                        if (args.datehint) { q += ' AND due_date LIKE ?'; params.push(`%${args.datehint}%`); }
                        const [upR] = await db.execute(q, params);
                        resTool = upR.affectedRows > 0 ? "Updated successfully" : "Task not found";
                    } else if (toolCall.function.name === "update_plan_status") {
                        let q = 'UPDATE plans SET status = ? WHERE user_id = ? AND title = ?';
                        let params = [args.status, userId, args.title];
                        if (args.datehint) { q += ' AND start_time LIKE ?'; params.push(`%${args.datehint}%`); }
                        const [upR] = await db.execute(q, params);
                        resTool = upR.affectedRows > 0 ? "Updated successfully" : "Plan not found";
                    } else if (toolCall.function.name === "delete_task") {
                        resTool = "Success, identified for deletion";
                    } else if (toolCall.function.name === "delete_plan") {
                        resTool = "Success, identified for deletion";
                    }
                    messages.push({ tool_call_id: toolCall.id, role: "tool", name: toolCall.function.name, content: resTool });
                }

                const secondRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${groqApiKey}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages })
                });
                const finalData = await secondRes.json();
                return res.json({ result: finalData.choices[0].message.content });
            }

            return res.json({ result: messageObj.content || "Bee chào bạn 🥰" });

        } catch (error) {
            console.error('AI Error:', error);
            res.status(500).json({ message: "Bee lỗi rồi, thử lại nhé 🥰" });
        }
    }
};

module.exports = aiController;
