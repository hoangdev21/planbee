const db = require('../config/db');
const { formatDateForMySQL, wallClockToUtcDate } = require('../utils/dateFormatter');
const { pickUniquePlanColor, normalizeHexColor } = require('../utils/planColor');
const { isShortPlanRange, findLongPlanDailyConflict } = require('../utils/planOverlap');
const NotificationController = require('./notificationController');

const isValidDate = (value) => value instanceof Date && !Number.isNaN(value.getTime());

const getUsedPlanColors = async (userId, excludePlanId = null) => {
    if (excludePlanId !== null) {
        const [rows] = await db.execute(
            'SELECT color FROM plans WHERE user_id = ? AND id != ? AND color IS NOT NULL',
            [userId, excludePlanId]
        );
        return rows.map((row) => row.color).filter(Boolean);
    }

    const [rows] = await db.execute(
        'SELECT color FROM plans WHERE user_id = ? AND color IS NOT NULL',
        [userId]
    );
    return rows.map((row) => row.color).filter(Boolean);
};

const getLongPlansByRange = async (userId, startDateTime, endDateTime, excludePlanId = null) => {
    const startDate = String(startDateTime).slice(0, 10);
    const endDate = String(endDateTime).slice(0, 10);

    if (excludePlanId !== null) {
        const [rows] = await db.execute(
            'SELECT id, title, start_time, end_time FROM plans WHERE user_id = ? AND id != ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) >= 86400 AND DATE(start_time) <= ? AND DATE(end_time) >= ?',
            [userId, excludePlanId, endDate, startDate]
        );
        return rows;
    }

    const [rows] = await db.execute(
        'SELECT id, title, start_time, end_time FROM plans WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) >= 86400 AND DATE(start_time) <= ? AND DATE(end_time) >= ?',
        [userId, endDate, startDate]
    );
    return rows;
};

const rebalancePlanColors = async (userId, plans) => {
    const usedColors = [];
    const updates = [];

    for (const plan of plans) {
        const nextColor = pickUniquePlanColor(usedColors, plan.color);
        usedColors.push(nextColor);

        if (normalizeHexColor(plan.color) !== nextColor) {
            plan.color = nextColor;
            updates.push(
                db.execute(
                    'UPDATE plans SET color = ? WHERE id = ? AND user_id = ?',
                    [nextColor, plan.id, userId]
                )
            );
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates);
    }

    return plans;
};

const planController = {
    // Get all user plans
    getPlans: async (req, res) => {
        try {
            const [plans] = await db.execute(
                'SELECT * FROM plans WHERE user_id = ? ORDER BY start_time ASC',
                [req.user.id]
            );

            const normalizedPlans = await rebalancePlanColors(req.user.id, plans);
            res.json({ plans: normalizedPlans });
        } catch (error) {
            console.error('Get plans error:', error);
            res.status(500).json({ message: 'Lỗi khi lấy kế hoạch.' });
        }
    },

    // Create a plan
    createPlan: async (req, res) => {
        try {
            const { title, description, start_time, end_time, color, priority } = req.body;
            
            if (!title || !start_time || !end_time) {
                return res.status(400).json({ message: 'Vui lòng nhập tên, thời gian bắt đầu và kết thúc!' });
            }

            const MySQLStart = formatDateForMySQL(start_time);
            const MySQLEnd = formatDateForMySQL(end_time);
            const startDate = wallClockToUtcDate(MySQLStart);
            const endDate = wallClockToUtcDate(MySQLEnd);

            if (!isValidDate(startDate) || !isValidDate(endDate) || !MySQLStart || !MySQLEnd) {
                return res.status(400).json({ message: 'Thời gian không hợp lệ.' });
            }

            if (startDate >= endDate) {
                return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu!' });
            }

            let overlaps = [];
            if (isShortPlanRange(startDate, endDate)) {
                [overlaps] = await db.execute(
                    'SELECT title FROM plans WHERE user_id = ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) < 86400 AND start_time < ? AND end_time > ? LIMIT 1',
                    [req.user.id, MySQLEnd, MySQLStart]
                );

                if (overlaps.length === 0) {
                    const longPlans = await getLongPlansByRange(req.user.id, MySQLStart, MySQLEnd);
                    const conflict = findLongPlanDailyConflict({
                        candidateStart: MySQLStart,
                        candidateEnd: MySQLEnd,
                        longPlans
                    });

                    if (conflict) {
                        overlaps = [{ title: conflict.title }];
                    }
                }
            }

            if (overlaps.length > 0) {
                return res.status(400).json({ 
                    message: `Lịch bị trùng với kế hoạch: "${overlaps[0].title}". Vui lòng chọn thời giờ khác! 🐝` 
                });
            }

            const usedColors = await getUsedPlanColors(req.user.id);
            const selectedColor = pickUniquePlanColor(usedColors, color);

            const [result] = await db.execute(
                'INSERT INTO plans (user_id, title, description, start_time, end_time, color, priority) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [req.user.id, title, description || '', MySQLStart, MySQLEnd, selectedColor, priority || 'medium']
            );

            await NotificationController.create(req.user.id, `Bạn đã lập kế hoạch mới: "${title}"`, 'plan', result.insertId);

            // Send instant Telegram notification
            const { sendSimpleMessage } = require('../services/telegramSender');
            if (sendSimpleMessage) {
                const start = wallClockToUtcDate(MySQLStart) || new Date();
                const end = wallClockToUtcDate(MySQLEnd) || new Date(start.getTime() + 60 * 60 * 1000);
                const viOpts = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
                const dayStr = start.toLocaleDateString('vi-VN', { ...viOpts, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                const timeRange = `${start.toLocaleTimeString('vi-VN', { ...viOpts, hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}-${end.toLocaleTimeString('vi-VN', { ...viOpts, hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`;
                
                const tgMsg = `*Thông báo lịch mới!* 🐝\nBạn đã thêm một lịch trình mới: *"${title}"*\n📍 Thời gian: \`${timeRange}\`\n🗓️ Ngày: _${dayStr}_ \n\n_Hãy chuẩn bị tốt nhất để hoàn thành công việc nhé!_ ✨`;
                await sendSimpleMessage(req.user.id, tgMsg);
            }

            res.status(201).json({ id: result.insertId, color: selectedColor, message: 'Lập kế hoạch thành công!' });
        } catch (error) {
            console.error('Create plan error:', error);
            res.status(500).json({ message: 'Lỗi khi tạo kế hoạch.' });
        }
    },

    // Update a plan
    updatePlan: async (req, res) => {
        try {
            const { id } = req.params;
            const updates = { ...req.body };

            if (updates.color !== undefined) {
                const usedColors = await getUsedPlanColors(req.user.id, id);
                updates.color = pickUniquePlanColor(usedColors, updates.color);
            }
            
            // Build dynamic query
            const fields = [];
            const values = [];
            
            const allowedFields = ['title', 'description', 'start_time', 'end_time', 'color', 'status', 'priority'];
            
            for (const field of allowedFields) {
                if (updates[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    if (field === 'start_time' || field === 'end_time') {
                        values.push(formatDateForMySQL(updates[field]));
                    } else {
                        values.push(updates[field]);
                    }
                }
            }

            if (fields.length === 0) {
                return res.status(400).json({ message: 'Không có dữ liệu cập nhật.' });
            }

            // Check for overlaps if time is updated
            if (updates.start_time || updates.end_time) {
                // We need the current or new values to check overlaps
                const [current] = await db.execute('SELECT start_time, end_time FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
                if (current.length > 0) {
                    const nextStartStr = formatDateForMySQL(updates.start_time || current[0].start_time);
                    const nextEndStr = formatDateForMySQL(updates.end_time || current[0].end_time);
                    const nextStartDate = wallClockToUtcDate(nextStartStr);
                    const nextEndDate = wallClockToUtcDate(nextEndStr);

                    if (!isValidDate(nextStartDate) || !isValidDate(nextEndDate)) {
                        return res.status(400).json({ message: 'Thời gian không hợp lệ.' });
                    }

                    if (nextStartDate >= nextEndDate) {
                        return res.status(400).json({ message: 'Thời gian kết thúc phải sau thời gian bắt đầu!' });
                    }

                    const MySQLStart = nextStartStr;
                    const MySQLEnd = nextEndStr;

                    let overlaps = [];
                    if (isShortPlanRange(nextStartDate, nextEndDate)) {
                        [overlaps] = await db.execute(
                            'SELECT title FROM plans WHERE user_id = ? AND id != ? AND TIMESTAMPDIFF(SECOND, start_time, end_time) < 86400 AND start_time < ? AND end_time > ? LIMIT 1',
                            [req.user.id, id, MySQLEnd, MySQLStart]
                        );

                        if (overlaps.length === 0) {
                            const longPlans = await getLongPlansByRange(req.user.id, MySQLStart, MySQLEnd, id);
                            const conflict = findLongPlanDailyConflict({
                                candidateStart: MySQLStart,
                                candidateEnd: MySQLEnd,
                                longPlans
                            });

                            if (conflict) {
                                overlaps = [{ title: conflict.title }];
                            }
                        }
                    }

                    if (overlaps.length > 0) {
                        return res.status(400).json({ 
                            message: `Cập nhật thất bại! Thời gian này bị trùng với kế hoạch: "${overlaps[0].title}".` 
                        });
                    }
                } else {
                    return res.status(404).json({ message: 'Không tìm thấy kế hoạch.' });
                }
            }

            values.push(id, req.user.id);
            const [result] = await db.execute(
                `UPDATE plans SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy kế hoạch.' });
            }
            res.json({ message: 'Cập nhật thành công!' });
        } catch (error) {
            console.error('Update plan error:', error);
            res.status(500).json({ message: 'Lỗi khi cập nhật.' });
        }
    },

    // Delete a plan
    deletePlan: async (req, res) => {
        try {
            const { id } = req.params;
            await db.execute('DELETE FROM plans WHERE id = ? AND user_id = ?', [id, req.user.id]);
            res.json({ message: 'Đã xóa kế hoạch.' });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi khi xóa.' });
        }
    }
};

module.exports = planController;
