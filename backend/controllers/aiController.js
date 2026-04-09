const db = require('../config/db');
const { formatDateForMySQL, wallClockToUtcDate } = require('../utils/dateFormatter');
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
const isMySqlDateTimeLike = (value) =>
    /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(String(value || '').trim());

const pad2 = (value) => String(value).padStart(2, '0');
const normalizeIntentText = (value) => String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const formatDateByTimeZone = (date, timeZone = 'Asia/Ho_Chi_Minh') => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    const map = {};
    for (const part of parts) {
        if (part.type !== 'literal') {
            map[part.type] = part.value;
        }
    }

    return {
        dateKey: `${map.year}-${map.month}-${map.day}`,
        dateTimeKey: `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second}`
    };
};

const toWallClockDateTime = (value) => {
    if (value === undefined || value === null || value === '') return '';

    if (value instanceof Date) {
        if (!isValidDate(value)) return '';
        // Use local calendar fields directly and avoid any extra timezone conversion.
        return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())} ${pad2(value.getHours())}:${pad2(value.getMinutes())}:${pad2(value.getSeconds())}`;
    }

    const raw = String(value).trim();
    if (!raw) return '';

    const normalized = formatDateForMySQL(raw);
    if (isMySqlDateTimeLike(normalized)) {
        return normalized.slice(0, 19);
    }

    const parsed = new Date(raw);
    if (!isValidDate(parsed)) return '';

    return `${parsed.getFullYear()}-${pad2(parsed.getMonth() + 1)}-${pad2(parsed.getDate())} ${pad2(parsed.getHours())}:${pad2(parsed.getMinutes())}:${pad2(parsed.getSeconds())}`;
};

const safeDateKey = (value) => toWallClockDateTime(value).slice(0, 10);
const safeTimeKey = (value) => toWallClockDateTime(value).slice(11, 16);

const addDaysToDateKey = (dateKey, days) => {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(dateKey || '').trim());
    if (!match) return '';

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const shifted = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
    return formatDateByTimeZone(shifted, 'Asia/Ho_Chi_Minh').dateKey;
};

const parseExplicitDateKey = (message, fallbackYear) => {
    const text = String(message || '').trim();
    if (!text) return '';

    const match = text.match(/(?:ngày\s*)?(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?/i);
    if (!match) return '';

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);

    let year = fallbackYear;
    if (match[3]) {
        year = parseInt(match[3], 10);
        if (year < 100) {
            year += 2000;
        }
    }

    if (!year || day < 1 || day > 31 || month < 1 || month > 12) return '';

    const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (
        probe.getUTCFullYear() !== year ||
        probe.getUTCMonth() !== (month - 1) ||
        probe.getUTCDate() !== day
    ) {
        return '';
    }

    return `${year}-${pad2(month)}-${pad2(day)}`;
};

const resolveTargetDateKeyFromMessage = (message, todayKey) => {
    const rawText = String(message || '');
    const text = normalizeIntentText(rawText);
    if (!rawText) return '';

    const defaultYear = parseInt(String(todayKey || '').slice(0, 4), 10) || new Date().getFullYear();
    const explicitDateKey = parseExplicitDateKey(rawText, defaultYear);
    if (explicitDateKey) return explicitDateKey;

    if (/\bhom\s+nay\b/i.test(text)) return todayKey;
    if (/\bngay\s+mai\b/i.test(text)) return addDaysToDateKey(todayKey, 1);

    return '';
};

const isScheduleModificationRequest = (message) => {
    const text = normalizeIntentText(message);
    if (!text) return false;

    // Vietnamese + common English verbs that indicate modifying schedule instead of viewing.
    // Keep this list broad to avoid the "overview" shortcut hijacking edit requests.
    return /\b(doi|sua|chinh\s*sua|cap\s*nhat|thay\s*doi|dieu\s*chinh|dich|doi\s*gio|doi\s*ngay|doi\s*lich|doi\s*ke\s*hoach|d(i|ì)\s*chuyen|chuyen|hoan|lui|day|move|reschedule|update|edit|modify)\b/i.test(text)
        || /\b(trang\s*thai|status|uu\s*tien|priority|mau|color|to\s*mau|doi\s*mau)\b/i.test(text);
};

const isScheduleOverviewQuery = (message) => {
    const text = normalizeIntentText(message);
    if (!text) return false;

    const hasDateRef = /\bhom\s+nay\b|\bngay\s+mai\b|(?:\bngay\s*)?\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?/i.test(text);
    const hasScheduleIntent = /viec\s*can\s*lam|ke\s*hoach|lich|cong\s*viec|task|plan/i.test(text);

    // Only treat as "overview" when user is asking to view/list, not edit.
    const hasViewVerb = /\b(xem|liet\s*ke|tong\s*hop|nhac|co\s*gi|cho\s*biet|kiem\s*tra|tra\s*cuu|tra\s*c(u|ứ)u|xem\s*lich|xem\s*lich\s*trinh|lich\s*trinh|hom\s*nay\s*(lam|co)\s*gi|today\s*(schedule|plan)|show|list|overview)\b/i.test(text);

    if (isScheduleModificationRequest(message)) return false;
    return hasDateRef && hasScheduleIntent && hasViewVerb;
};

const formatDateKeyToVi = (dateKey) => {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(dateKey || '').trim());
    if (!match) return dateKey;
    return `${match[3]}/${match[2]}/${match[1]}`;
};

const getWeekdayByDateKey = (dateKey) => {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(dateKey || '').trim());
    if (!match) return '';

    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    const weekday = probe.toLocaleDateString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'long'
    });

    return weekday
        ? `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}`
        : '';
};

const buildDirectScheduleOverview = ({ message, todayKey, taskData, planData, habitData }) => {
    if (!isScheduleOverviewQuery(message)) return '';

    const targetDateKey = resolveTargetDateKeyFromMessage(message, todayKey);
    if (!targetDateKey) return '';

    const tomorrowKey = addDaysToDateKey(todayKey, 1);
    const dateLabel = targetDateKey === todayKey
        ? 'Hôm nay'
        : (targetDateKey === tomorrowKey ? 'Ngày mai' : `Ngày ${formatDateKeyToVi(targetDateKey)}`);
    const weekdayLabel = getWeekdayByDateKey(targetDateKey);

    const plansOnDate = planData
        .filter((plan) => {
            const startKey = safeDateKey(plan.start_time);
            const endKey = safeDateKey(plan.end_time);
            return Boolean(startKey && endKey && targetDateKey >= startKey && targetDateKey <= endKey);
        })
        .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));

    const tasksOnDate = taskData
        .filter((task) => safeDateKey(task.due_date) === targetDateKey)
        .sort((a, b) => String(a.due_date || '').localeCompare(String(b.due_date || '')));

    const activeHabits = habitData.filter((habit) => Boolean(habit && habit.title));

    const planLines = plansOnDate.length > 0
        ? plansOnDate.map((plan) => `- ${plan.title} (Bắt đầu: ${safeTimeKey(plan.start_time)}, Kết thúc: ${safeTimeKey(plan.end_time)}, Trạng thái: ${plan.status})`).join('\n')
        : '- (Không có kế hoạch nào)';

    const taskLines = tasksOnDate.length > 0
        ? tasksOnDate.map((task) => `- ${task.title} (Hạn: ${safeTimeKey(task.due_date)}, Trạng thái: ${task.status})`).join('\n')
        : '- (Không có nhiệm vụ nào)';

    const habitLines = activeHabits.length > 0
        ? activeHabits.map((habit) => `- ${habit.title} (Tần suất: ${habit.frequency})`).join('\n')
        : '- (Chưa có thói quen nào)';

    const headDate = weekdayLabel
        ? `${dateLabel} là ${weekdayLabel}, ${formatDateKeyToVi(targetDateKey)}.`
        : `${dateLabel}: ${formatDateKeyToVi(targetDateKey)}.`;

    return [
        'Xin chào! 🐝',
        headDate,
        'Dưới đây là các kế hoạch của bạn:',
        planLines,
        'Việc cần làm trong ngày:',
        taskLines,
        'Về thói quen, bạn có thể xem xét thực hiện:',
        habitLines,
        'Bee giữ nguyên giờ theo lịch bạn đã lưu (không cộng/trừ múi giờ) nhé! 🐝'
    ].join('\n');
};

const parseWeekdayFromViText = (message) => {
    const text = normalizeIntentText(message);
    if (!text) return null;

    // Vietnamese mapping: Thứ 2..Thứ 7 => Mon..Sat, CN/Chủ nhật => Sun
    // JS getDay(): Sun=0, Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6
    if (/\b(cn|chu\s*nhat|chunhat|chu\s*nhật)\b/i.test(text)) return 0;

    const m = text.match(/\bthu\s*([2-7])\b/i);
    if (m) {
        const n = parseInt(m[1], 10);
        if (n >= 2 && n <= 7) return n - 1; // Thứ 2 -> 1 ... Thứ 7 -> 6
    }

    // Handle common word forms (after normalize removes diacritics)
    if (/\bthu\s*hai\b/i.test(text)) return 1;
    if (/\bthu\s*ba\b/i.test(text)) return 2;
    if (/\bthu\s*tu\b/i.test(text)) return 3;
    if (/\bthu\s*nam\b/i.test(text)) return 4;
    if (/\bthu\s*sau\b/i.test(text)) return 5;
    if (/\bthu\s*bay\b/i.test(text)) return 6;

    return null;
};

const parseTimeRangeFromViText = (message) => {
    const text = normalizeIntentText(message);
    if (!text) return null;

    // Examples:
    // - "19h - 21h"
    // - "19:00-21:00"
    // - "luc 19h den 21h"
    const m = text.match(
        /(?:luc\s*)?(\d{1,2})(?:\s*(?:h(?:\s*(\d{2}))?|:\s*(\d{2})))?\s*(?:-|–|—|den|toi)\s*(\d{1,2})(?:\s*(?:h(?:\s*(\d{2}))?|:\s*(\d{2})))?\b/i
    );
    if (!m) return null;

    const sh = parseInt(m[1], 10);
    const sm = m[2] ? parseInt(m[2], 10) : (m[3] ? parseInt(m[3], 10) : 0);
    const eh = parseInt(m[4], 10);
    const em = m[5] ? parseInt(m[5], 10) : (m[6] ? parseInt(m[6], 10) : 0);

    if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return null;
    if (sh < 0 || sh > 23 || eh < 0 || eh > 23 || sm < 0 || sm > 59 || em < 0 || em > 59) return null;

    return { sh, sm, eh, em };
};

const pad2Str = (n) => String(n).padStart(2, '0');

const getWeekdayIndexFromDateKey = (dateKey) => {
    const match = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(dateKey || '').trim());
    if (!match) return null;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    // getUTCDay() == local weekday for that "noon UTC" anchor in VN time.
    return probe.getUTCDay();
};

const buildDirectWeeklyRecurringPlan = async ({ userId, message, todayKey, platform }) => {
    const text = normalizeIntentText(message);
    if (!text) return '';

    // Only handle explicit weekly recurrence phrases
    const wantsWeekly = /\b(moi|mỗi)\b.*\b(hang\s*tuan|hang\s*tu(a|â)n|tuan|weekly)\b/i.test(text)
        || /\b(moi|mỗi)\s*thu\b/i.test(text);
    if (!wantsWeekly) return '';

    const weekday = parseWeekdayFromViText(message);
    const timeRange = parseTimeRangeFromViText(message);
    if (weekday === null || !timeRange) return '';

    // Title: try to extract after "dat lich" or "lịch"
    let title = '';
    const titleMatch = String(message || '').match(/(?:đặt\s*lịch|dat\s*lich|lịch)\s+(.+?)(?:\s+mỗi|\s+moi|\s+hàng\s*tuần|\s+hang\s*tuan|\s+lúc|\s+luc|$)/i);
    if (titleMatch && titleMatch[1]) {
        title = String(titleMatch[1]).trim();
    }
    if (!title) title = 'Lịch lặp hàng tuần';

    const todayDow = getWeekdayIndexFromDateKey(todayKey);
    if (todayDow === null) return '';

    const delta = (weekday - todayDow + 7) % 7;
    const firstDateKey = addDaysToDateKey(todayKey, delta);
    if (!firstDateKey) return '';

    const { sh, sm, eh, em } = timeRange;
    const weeksToCreate = 12; // create next 12 weeks by default

    const created = [];
    const skipped = [];

    for (let i = 0; i < weeksToCreate; i++) {
        const dateKey = addDaysToDateKey(firstDateKey, 7 * i);
        const start = `${dateKey} ${pad2Str(sh)}:${pad2Str(sm)}:00`;
        const end = `${dateKey} ${pad2Str(eh)}:${pad2Str(em)}:00`;

        const startDate = wallClockToUtcDate(start);
        const endDate = wallClockToUtcDate(end);
        if (!isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate) {
            skipped.push(dateKey);
            continue;
        }

        // Overlap check for short plans
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
                if (conflict) overlaps = [{ title: conflict.title }];
            }
        }

        if (overlaps.length > 0) {
            skipped.push(dateKey);
            continue;
        }

        const [result] = await db.execute(
            'INSERT INTO plans (user_id, title, start_time, end_time, priority) VALUES (?, ?, ?, ?, ?)',
            [userId, title, start, end, 'medium']
        );
        created.push({ id: result.insertId, dateKey });
    }

    if (created.length === 0) {
        return `Bee chưa tạo được lịch lặp do bị trùng lịch hoặc thời gian không hợp lệ. Bạn thử đổi khung giờ giúp Bee nhé! 🐝`;
    }

    const first = created[0];
    const viewTag = (platform === 'web')
        ? `\n${makeActionTag('view_plan', { id: first.id, title, date: first.dateKey, time: `${pad2Str(sh)}:${pad2Str(sm)}`, start_time: `${first.dateKey} ${pad2Str(sh)}:${pad2Str(sm)}:00`, end_time: `${first.dateKey} ${pad2Str(eh)}:${pad2Str(em)}:00`, view: 'day' })}`
        : '';

    const skippedNote = skipped.length > 0
        ? `\n\nLưu ý: Bee bỏ qua ${skipped.length} tuần do trùng lịch/không hợp lệ.`
        : '';

    return `Bee đã tạo lịch "${title}" lặp *mỗi tuần* vào Thứ ${weekday === 0 ? 'CN' : (weekday + 1)} lúc ${pad2Str(sh)}:${pad2Str(sm)}-${pad2Str(eh)}:${pad2Str(em)} (tạo ${created.length} tuần sắp tới). 🐝${skippedNote}${viewTag}`;
};

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
        const { dateKey: todayKey, dateTimeKey: nowLocal } = formatDateByTimeZone(now, 'Asia/Ho_Chi_Minh');
        
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
        // NOTE: Avoid NOW()-based filtering because DB/server timezone may differ from user's wall-clock (Asia/Ho_Chi_Minh).
        const [t] = await db.execute(
            'SELECT id, title, description, status, priority, due_date FROM tasks WHERE user_id = ? ORDER BY (status = "completed") ASC, priority DESC, due_date ASC LIMIT 50',
            [userId]
        );
        const [p] = await db.execute(
            'SELECT id, title, description, status, priority, start_time, end_time FROM plans WHERE user_id = ? ORDER BY start_time ASC LIMIT 50',
            [userId]
        );
        const [h] = await db.execute(
            'SELECT id, title, description, frequency, goal, current_streak, last_completed FROM habits WHERE user_id = ? LIMIT 30',
            [userId]
        );
        
        taskData = t; planData = p; habitData = h;

        const directWeeklyRecurringReply = await buildDirectWeeklyRecurringPlan({
            userId,
            message,
            todayKey,
            platform
        });

        if (directWeeklyRecurringReply) {
            db.execute(
                'INSERT INTO chat_logs (user_id, message, response, tokens_used) VALUES (?, ?, ?, ?)',
                [userId, message, directWeeklyRecurringReply, 0]
            ).catch((logError) => console.warn('[AI] Skip chat_logs insert:', logError.message));

            return directWeeklyRecurringReply;
        }

        const directScheduleReply = buildDirectScheduleOverview({
            message,
            todayKey,
            taskData,
            planData,
            habitData
        });

        if (directScheduleReply) {
            db.execute(
                'INSERT INTO chat_logs (user_id, message, response, tokens_used) VALUES (?, ?, ?, ?)',
                [userId, message, directScheduleReply, 0]
            ).catch((logError) => console.warn('[AI] Skip chat_logs insert:', logError.message));

            return directScheduleReply;
        }

        const formatContextDate = (date) => {
            if (!date) return 'N/A';
            const normalized = toWallClockDateTime(date);
            if (!normalized) return 'N/A';
            const day = normalized.slice(0, 10);
            const time = normalized.slice(11, 16);
            return `${time} ${day}`;
        };

        const tasksStr = taskData.map(t => `- **${t.title}** [id:${t.id}] (Hạn: ${formatContextDate(t.due_date)}, Trạng thái: ${t.status})`).join('\n');
        const plansStr = planData.map(p => `- **${p.title}** [id:${p.id}] (Bắt đầu: ${formatContextDate(p.start_time)}, Kết thúc: ${formatContextDate(p.end_time)}, Trạng thái: ${p.status})`).join('\n');
        const habitsStr = habitData.map(h => `- **${h.title}** (Tần suất: ${h.frequency}, Chuỗi: ${h.current_streak}, Hoàn thành gần nhất: ${formatContextDate(h.last_completed)})`).join('\n');

        // Pre-computed "today" + "overdue" sets in Asia/Ho_Chi_Minh wall-clock (string-based).
        const nowKey = todayKey;

        const todayTasks = taskData.filter((t) => safeDateKey(t.due_date) === nowKey);
        const overdueTasks = taskData.filter((t) => {
            if (t.status === 'completed' || !t.due_date) return false;
            const due = toWallClockDateTime(t.due_date);
            if (!due) return false;
            return due < nowLocal;
        });

        const todayPlans = planData.filter((p) => {
            const startKey = safeDateKey(p.start_time);
            const endKey = safeDateKey(p.end_time);
            return nowKey >= startKey && nowKey <= endKey;
        });

        const todayTasksStr = todayTasks
            .map((t) => `- ${safeTimeKey(t.due_date)} • ${t.title}`)
            .join('\n');
        const overdueTasksStr = overdueTasks
            .slice(0, 15)
            .map((t) => `- ${safeTimeKey(t.due_date)} ${safeDateKey(t.due_date)} • ${t.title}`)
            .join('\n');
        const todayPlansStr = todayPlans
            .map((p) => `- ${safeTimeKey(p.start_time)}-${safeTimeKey(p.end_time)} • ${p.title}`)
            .join('\n');

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
- Hôm nay (Asia/Ho_Chi_Minh): ${todayKey}
- QUAN TRỌNG: Tất cả thời gian trong dữ liệu dưới đây là GIỜ VIỆT NAM (Asia/Ho_Chi_Minh). Khi trả lời, GIỮ NGUYÊN giờ (không cộng/trừ múi giờ).
- TÓM TẮT HÔM NAY (đã lọc sẵn theo ${todayKey}):
  - Lịch hôm nay:
${todayPlansStr || '  (Trống)'}
  - Việc cần làm hôm nay:
${todayTasksStr || '  (Trống)'}
  - Việc quá hạn (tính tới hiện tại):
${overdueTasksStr || '  (Không có)'}
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
                        const startStr = formatDateForMySQL(args.start_time);
                        const endStr = formatDateForMySQL(args.end_time);
                        const startDate = wallClockToUtcDate(startStr);
                        const endDate = wallClockToUtcDate(endStr);

                        if (!startStr || !endStr || !isValidDate(startDate) || !isValidDate(endDate) || startDate >= endDate) {
                            resTool = "Error: Invalid time range.";
                        } else {
                            const start = startStr;
                            const end = endStr;

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
                                    const s = wallClockToUtcDate(start) || new Date();
                                    const e = wallClockToUtcDate(end) || new Date(s.getTime() + 60 * 60 * 1000);
                                    const viOpts = { timeZone: 'Asia/Ho_Chi_Minh', hour12: false };
                                    const dayStr = s.toLocaleDateString('vi-VN', { ...viOpts, weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
                                    const timeRange = `${s.toLocaleTimeString('vi-VN', { ...viOpts, hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}-${e.toLocaleTimeString('vi-VN', { ...viOpts, hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}`;
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

