const DISTINCT_PLAN_COLORS = [
    '#1E88E5', '#43A047', '#F4511E', '#8E24AA', '#00897B',
    '#3949AB', '#FB8C00', '#C0CA33', '#D81B60', '#5E35B1',
    '#00ACC1', '#7CB342', '#EF6C00', '#6D4C41', '#546E7A',
    '#E53935', '#039BE5', '#9CCC65', '#FFB300', '#26A69A'
];

const normalizeHexColor = (value) => {
    if (!value || typeof value !== 'string') return null;

    const raw = value.trim().replace(/^#/, '');
    if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(raw)) return null;

    const expanded = raw.length === 3
        ? raw.split('').map((c) => c + c).join('')
        : raw;

    return `#${expanded.toUpperCase()}`;
};

const hexToRgb = (hex) => {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return null;

    return {
        r: parseInt(normalized.slice(1, 3), 16),
        g: parseInt(normalized.slice(3, 5), 16),
        b: parseInt(normalized.slice(5, 7), 16)
    };
};

const colorDistance = (a, b) => {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;
    return Math.sqrt((dr * dr) + (dg * dg) + (db * db));
};

const hslToHex = (h, s, l) => {
    const saturation = s / 100;
    const lightness = l / 100;

    const c = (1 - Math.abs((2 * lightness) - 1)) * saturation;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = lightness - (c / 2);

    let r = 0;
    let g = 0;
    let b = 0;

    if (h >= 0 && h < 60) {
        r = c; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c; b = 0;
    } else if (h < 180) {
        r = 0; g = c; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c;
    } else if (h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    const toHex = (channel) => Math.round((channel + m) * 255).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const pickUniquePlanColor = (usedColors = [], preferredColor = null) => {
    const normalizedUsed = [...new Set(usedColors
        .map((color) => normalizeHexColor(color))
        .filter(Boolean))];

    const usedSet = new Set(normalizedUsed);
    const normalizedPreferred = normalizeHexColor(preferredColor);

    if (normalizedPreferred && !usedSet.has(normalizedPreferred)) {
        return normalizedPreferred;
    }

    for (const color of DISTINCT_PLAN_COLORS) {
        if (!usedSet.has(color)) {
            return color;
        }
    }

    const usedRgb = normalizedUsed.map(hexToRgb).filter(Boolean);
    let fallbackColor = null;

    // Golden-angle sweep for stable, highly separated generated colors.
    for (let i = 0; i < 1440; i++) {
        const hue = (i * 137.508) % 360;
        const saturation = 72 + ((i % 3) * 8);
        const lightness = 48 + ((i % 2) * 8);
        const candidate = hslToHex(hue, saturation, lightness);

        if (usedSet.has(candidate)) continue;
        if (!fallbackColor) fallbackColor = candidate;

        if (usedRgb.length === 0) return candidate;

        const rgbCandidate = hexToRgb(candidate);
        const minDistance = Math.min(...usedRgb.map((rgb) => colorDistance(rgbCandidate, rgb)));

        // >= 90 in RGB space keeps colors clearly distinguishable in UI cards.
        if (minDistance >= 90) {
            return candidate;
        }

    }

    return fallbackColor || '#1E88E5';
};

module.exports = {
    normalizeHexColor,
    pickUniquePlanColor
};