const SHORT_PLAN_MAX_MS = 24 * 60 * 60 * 1000;

const isShortPlanRange = (startDate, endDate) => (endDate.getTime() - startDate.getTime()) < SHORT_PLAN_MAX_MS;

const toDateKey = (dateTimeValue) => String(dateTimeValue || '').slice(0, 10);

const toMinutes = (dateTimeValue) => {
    const hhmm = String(dateTimeValue || '').slice(11, 16);
    const [hours, minutes] = hhmm.split(':').map((v) => parseInt(v, 10));

    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
        return 0;
    }

    return (hours * 60) + minutes;
};

const nextDateKey = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map((v) => parseInt(v, 10));
    const utcDate = new Date(Date.UTC(year, month - 1, day));
    utcDate.setUTCDate(utcDate.getUTCDate() + 1);
    return utcDate.toISOString().slice(0, 10);
};

const buildCandidateSegmentsByDate = (startDateTime, endDateTime) => {
    const startDateKey = toDateKey(startDateTime);
    const endDateKey = toDateKey(endDateTime);
    const startMinute = toMinutes(startDateTime);
    const endMinute = toMinutes(endDateTime);

    const byDate = new Map();

    if (startDateKey === endDateKey) {
        byDate.set(startDateKey, [[startMinute, endMinute]]);
        return byDate;
    }

    byDate.set(startDateKey, [[startMinute, 1440]]);

    let cursor = nextDateKey(startDateKey);
    while (cursor < endDateKey) {
        byDate.set(cursor, [[0, 1440]]);
        cursor = nextDateKey(cursor);
    }

    byDate.set(endDateKey, [[0, endMinute]]);
    return byDate;
};

const buildRecurringSegments = (startDateTime, endDateTime) => {
    const startMinute = toMinutes(startDateTime);
    const endMinute = toMinutes(endDateTime);

    if (startMinute === endMinute) {
        return [[0, 1440]];
    }

    if (endMinute > startMinute) {
        return [[startMinute, endMinute]];
    }

    return [[startMinute, 1440], [0, endMinute]];
};

const hasOverlap = (segmentsA, segmentsB) => {
    for (const [aStart, aEnd] of segmentsA) {
        for (const [bStart, bEnd] of segmentsB) {
            if (aStart < bEnd && aEnd > bStart) {
                return true;
            }
        }
    }

    return false;
};

const findLongPlanDailyConflict = ({ candidateStart, candidateEnd, longPlans = [] }) => {
    const candidateByDate = buildCandidateSegmentsByDate(candidateStart, candidateEnd);

    for (const plan of longPlans) {
        const planStartDate = toDateKey(plan.start_time);
        const planEndDate = toDateKey(plan.end_time);
        const recurringSegments = buildRecurringSegments(plan.start_time, plan.end_time);

        for (const [dayKey, candidateSegments] of candidateByDate.entries()) {
            if (dayKey < planStartDate || dayKey > planEndDate) {
                continue;
            }

            if (hasOverlap(candidateSegments, recurringSegments)) {
                return plan;
            }
        }
    }

    return null;
};

module.exports = {
    SHORT_PLAN_MAX_MS,
    isShortPlanRange,
    findLongPlanDailyConflict
};