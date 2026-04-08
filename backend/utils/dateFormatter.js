/**
 * Converts any date string or Date object to MySQL-compatible 'YYYY-MM-DD HH:MM:SS' format.
 * Prevents 'ER_TRUNCATED_WRONG_VALUE' errors.
 */
const normalizeDateTimeString = (rawValue) => {
    if (typeof rawValue !== 'string') return null;

    const value = rawValue.trim();
    if (!value) return null;

    // Preserve wall-clock time and ignore timezone suffixes (Z, +07:00, -0500, ...).
    const dateTimeMatch = value.match(
        /^(\d{4})-(\d{2})-(\d{2})(?:[T\s])(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/
    );

    if (dateTimeMatch) {
        const [, year, month, day, hours, minutes, seconds] = dateTimeMatch;
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds || '00'}`;
    }

    const dateOnlyMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
        const [, year, month, day] = dateOnlyMatch;
        return `${year}-${month}-${day} 00:00:00`;
    }

    return null;
};

const formatDateForMySQL = (dateInput) => {
    if (!dateInput) return null;
    try {
        const normalized = normalizeDateTimeString(dateInput);
        if (normalized) return normalized;

        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return dateInput; // Return as-is if invalid
        
        // Format to YYYY-MM-DD HH:MM:SS
        const pad = (n) => n.toString().padStart(2, '0');
        const year = d.getFullYear();
        const month = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hours = pad(d.getHours());
        const minutes = pad(d.getMinutes());
        const seconds = pad(d.getSeconds());
        
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) { 
        console.warn("Date formatting error:", e.message);
        return dateInput; 
    }
};

const parseMySqlDateTimeParts = (value) => {
    if (value === undefined || value === null) return null;
    const normalized = normalizeDateTimeString(String(value));
    if (!normalized) return null;

    const m = normalized.match(
        /^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2}):(\d{2})$/
    );
    if (!m) return null;

    const [, y, mo, d, hh, mm, ss] = m;
    return {
        year: parseInt(y, 10),
        month: parseInt(mo, 10),
        day: parseInt(d, 10),
        hour: parseInt(hh, 10),
        minute: parseInt(mm, 10),
        second: parseInt(ss, 10),
        normalized
    };
};

/**
 * Interpret a MySQL datetime string as a wall-clock in a fixed offset timezone,
 * and return its UTC epoch ms. Default offset is Asia/Ho_Chi_Minh (UTC+07:00).
 */
const wallClockToUtcMs = (dateTimeValue, offsetMinutes = 420) => {
    const parts = parseMySqlDateTimeParts(dateTimeValue);
    if (!parts) return NaN;
    const utcMs = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second
    ) - (offsetMinutes * 60 * 1000);
    return utcMs;
};

const wallClockToUtcDate = (dateTimeValue, offsetMinutes = 420) => {
    const ms = wallClockToUtcMs(dateTimeValue, offsetMinutes);
    if (Number.isNaN(ms)) return null;
    return new Date(ms);
};

module.exports = {
    formatDateForMySQL,
    wallClockToUtcMs,
    wallClockToUtcDate
};
