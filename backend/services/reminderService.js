const cron = require('node-cron');
const db = require('../config/db');
const { sendSimpleMessage } = require('./telegramSender');
const { formatDateForMySQL } = require('../utils/dateFormatter');

const reminderService = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        const now = new Date();
        const in5Minutes = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
        
        const nowStr = formatDateForMySQL(now);
        const in5MinutesStr = formatDateForMySQL(in5Minutes); 

        try {
            // 1. Check for PLANS (Strictly 5 minutes before start)
            // Selecting plans that start within the next 5-6 minutes window
            const [plans] = await db.execute(
                'SELECT * FROM plans WHERE reminder_sent = 0 AND start_time > ? AND start_time <= ? AND status != "completed"',
                [nowStr, in5MinutesStr]
            );

            for (const plan of plans) {
                const startTime = new Date(plan.start_time);
                const endTime = new Date(plan.end_time);
                const diffMs = startTime - now;
                const diffMin = Math.round(diffMs / 60000);
                
                let timeHeader = "🔔 *Nhắc nhở kế hoạch!*";
                let timeSub = `Chỉ còn khoảng \`${diffMin} phút\` nữa...`;
                
                if (diffMin <= 0) {
                    timeHeader = "🚀 *Đã tới giờ thực hiện!*";
                    timeSub = "Bắt đầu ngay thôi nào!";
                }

                const startTimeStr = `${startTime.getHours()}h${startTime.getMinutes().toString().padStart(2, '0')}`;
                const endTimeStr = `${endTime.getHours()}h${endTime.getMinutes().toString().padStart(2, '0')}`;

                const message = `${timeHeader} 🐝\n\n${timeSub}\n📍 Công việc: *"${plan.title}"*\n⏰ Thời gian: \`${startTimeStr} - ${endTimeStr}\`\n\n_Chúc bạn có một phiên làm việc hiệu quả và năng suất nhé!_ 💪✨`;
                
                const sent = await sendSimpleMessage(plan.user_id, message);
                if (sent) {
                    await db.execute('UPDATE plans SET reminder_sent = 1 WHERE id = ?', [plan.id]);
                }
            }

            // 2. Check for TASKS (Notify at deadline if not notified)
            const [tasks] = await db.execute(
                'SELECT * FROM tasks WHERE reminder_sent = 0 AND due_date <= ? AND status != "completed"',
                [nowStr]
            );

            for (const task of tasks) {
                const message = `⚠️ *Hạn chót công việc!* 🐝\n\nNhiệm vụ: *"${task.title}"* đã tới hạn chót.\n\n_Hãy kiểm tra và hoàn thành nó ngay nhé!_ 🚀`;
                
                const sent = await sendSimpleMessage(task.user_id, message);
                if (sent) {
                    await db.execute('UPDATE tasks SET reminder_sent = 1 WHERE id = ?', [task.id]);
                }
            }

        } catch (error) {
            console.error('Reminder Service Error:', error);
        }
    });

    console.log('Reminder Service initialized and polling every minute... ⏰');
};

module.exports = reminderService;
