const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const keepAlive = require('./utils/keepAlive');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
require('./services/telegramBot'); // Start the bot service
const reminderService = require('./services/reminderService');
reminderService(); // Start reminder service

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

const UNIQUE_ALLOWED_ORIGINS = [...new Set(ALLOWED_ORIGINS)];

app.use(cors({
    origin: (origin, callback) => {
        const normalizedOrigin = origin ? origin.replace(/\/+$/, '') : origin;

        if (!normalizedOrigin || UNIQUE_ALLOWED_ORIGINS.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${normalizedOrigin}`);
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to PlanBee API' });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'planbee-backend',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

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
    
    // Self-ping to keeps the Render Free-Tier instance alive
    if (process.env.NODE_ENV === 'production') {
        const BACKEND_URL = process.env.BACKEND_URL;
        keepAlive(BACKEND_URL);
    }
});
