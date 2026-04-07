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

module.exports = { formatDateForMySQL };
