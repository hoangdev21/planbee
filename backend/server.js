const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const keepAlive = require('./utils/keepAlive');

const app = express();
const PORT = process.env.PORT || 5000;
require('./services/telegramBot'); // Start the bot service
const reminderService = require('./services/reminderService');
reminderService(); // Start reminder service

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to PlanBee API' });
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

// Error Handling
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ message: 'Lỗi hệ thống!' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
    // Self-ping to keeps the Render Free-Tier instance alive
    if (process.env.NODE_ENV === 'production') {
        const BACKEND_URL = process.env.BACKEND_URL;
        keepAlive(BACKEND_URL);
    }
});
