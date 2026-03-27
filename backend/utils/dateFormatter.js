/**
 * Converts any date string or Date object to MySQL-compatible 'YYYY-MM-DD HH:MM:SS' format.
 * Prevents 'ER_TRUNCATED_WRONG_VALUE' errors.
 */
const formatDateForMySQL = (dateInput) => {
    if (!dateInput) return null;
    try {
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
