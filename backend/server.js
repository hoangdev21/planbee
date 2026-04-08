const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const keepAlive = require('./utils/keepAlive');

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

const parseBooleanEnv = (value, fallback = false) => {
    if (value === undefined || value === null || String(value).trim() === '') {
        return fallback;
    }

    return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const START_TELEGRAM_BOT = parseBooleanEnv(process.env.START_TELEGRAM_BOT, false);
const START_REMINDER_SERVICE = parseBooleanEnv(process.env.START_REMINDER_SERVICE, false);
const ENABLE_SELF_PING = parseBooleanEnv(process.env.ENABLE_SELF_PING, false);
const IS_RENDER_RUNTIME = parseBooleanEnv(process.env.RENDER, false) || Boolean(process.env.RENDER_SERVICE_ID);

if (START_TELEGRAM_BOT) {
    try {
        require('./services/telegramBot');
    } catch (error) {
        console.error('[Bootstrap] Telegram bot failed to initialize:', error);
    }
} else {
    console.log('[Bootstrap] Telegram bot disabled by START_TELEGRAM_BOT=false');
}

if (START_REMINDER_SERVICE) {
    try {
        const reminderService = require('./services/reminderService');
        reminderService();
    } catch (error) {
        console.error('[Bootstrap] Reminder service failed to initialize:', error);
    }
} else {
    console.log('[Bootstrap] Reminder service disabled by START_REMINDER_SERVICE=false');
}

process.on('unhandledRejection', (reason) => {
    console.error('[Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('[Process] Uncaught Exception:', error);
});

// Middleware
const parseOriginList = (originValue = '') =>
    originValue
        .split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);

const envOrigins = parseOriginList(process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '');

const ALLOWED_ORIGINS = [
    ...envOrigins,
    'https://www.planbee.me',
    'https://planbee.me',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
].filter(Boolean);

const UNIQUE_ALLOWED_ORIGINS = new Set(ALLOWED_ORIGINS);
const ALLOWED_ORIGIN_PATTERNS = [
    /^https:\/\/(?:[a-z0-9-]+\.)?planbee\.me$/i,
    /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/i,
];

const isOriginAllowed = (origin = '') => {
    const normalizedOrigin = origin.trim().replace(/\/+$/, '');
    return UNIQUE_ALLOWED_ORIGINS.has(normalizedOrigin)
        || ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(normalizedOrigin));
};

const CORS_OPTIONS = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Rejected: ${origin}`);
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 204,
};

app.use(cors(CORS_OPTIONS));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to PlanBee API' });
});

const healthHandler = (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'planbee-backend',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');
const planRoutes = require('./routes/planRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const aiRoutes = require('./routes/aiRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Keep API responses JSON-only, even for unknown endpoints.
app.use('/api', (req, res) => {
    res.status(404).json({
        message: `API endpoint không tồn tại: ${req.method} ${req.originalUrl}`
    });
});

// Error Handling
app.use((err, req, res, next) => {
    if (err.message === 'CORS not allowed') {
        return res.status(403).json({ message: 'Origin không được phép truy cập API.' });
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ message: 'JSON body không hợp lệ.' });
    }

    console.error('Server Error:', err.stack);
    res.status(500).json({ message: 'Lỗi hệ thống!' });
});

app.listen(PORT, HOST, () => {
    console.log(`Server is running on ${HOST}:${PORT}`);
    
    // Keep-alive pinger should be opt-in and disabled on Render to avoid self-loop calls via edge network.
    if (process.env.NODE_ENV === 'production' && ENABLE_SELF_PING && !IS_RENDER_RUNTIME) {
        const BACKEND_URL = process.env.BACKEND_URL;
        keepAlive(BACKEND_URL);
    } else if (process.env.NODE_ENV === 'production') {
        const reason = !ENABLE_SELF_PING
            ? 'ENABLE_SELF_PING=false'
            : 'Render runtime detected';
        console.log(`[Keep-Alive] Disabled (${reason})`);
    }
});
