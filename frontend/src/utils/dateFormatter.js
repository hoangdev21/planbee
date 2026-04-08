/**
 * Formats a Date object or string to 'YYYY-MM-DD' using local time.
 * This prevents timezone shifts associated with .toISOString().
 */
export const parseToLocalDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) {
        return isNaN(dateInput.getTime()) ? null : dateInput;
    }

    const raw = String(dateInput).trim();
    if (!raw) return null;

    // MySQL datetime: YYYY-MM-DD HH:MM:SS
    let m = raw.match(/^(\d{4})-(\d{2})-(\d{2})\s(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
        const [, y, mo, d, hh, mm, ss] = m;
        const dt = new Date(
            parseInt(y, 10),
            parseInt(mo, 10) - 1,
            parseInt(d, 10),
            parseInt(hh, 10),
            parseInt(mm, 10),
            parseInt(ss || '0', 10),
            0
        );
        return isNaN(dt.getTime()) ? null : dt;
    }

    // Date-only (treat as local midnight)
    m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
        const [, y, mo, d] = m;
        const dt = new Date(parseInt(y, 10), parseInt(mo, 10) - 1, parseInt(d, 10), 0, 0, 0, 0);
        return isNaN(dt.getTime()) ? null : dt;
    }

    // datetime-local: YYYY-MM-DDTHH:MM or with seconds
    m = raw.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
        const [, y, mo, d, hh, mm, ss] = m;
        const dt = new Date(
            parseInt(y, 10),
            parseInt(mo, 10) - 1,
            parseInt(d, 10),
            parseInt(hh, 10),
            parseInt(mm, 10),
            parseInt(ss || '0', 10),
            0
        );
        return isNaN(dt.getTime()) ? null : dt;
    }

    // ISO with timezone, or other formats: fall back to built-in parser
    const fallback = new Date(raw);
    return isNaN(fallback.getTime()) ? null : fallback;
};

export const formatDateToYYYYMMDD = (dateInput) => {
    if (!dateInput) return '';
    const d = parseToLocalDate(dateInput);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object or string to 'YYYY-MM-DD HH:MM:SS' using local time.
 */
export const formatDateTimeToLocal = (dateInput) => {
    if (!dateInput) return '';
    const d = parseToLocalDate(dateInput);
    if (!d) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
