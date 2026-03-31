const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Dashboard Overview
router.get('/stats', adminMiddleware, adminController.getStats);

// User Management
router.get('/users', adminMiddleware, adminController.getUsers);
router.put('/users/:id', adminMiddleware, adminController.updateUser);

// AI Configuration
router.get('/config/ai-prompt', adminMiddleware, adminController.getAIConfig);
router.post('/config/ai-prompt', adminMiddleware, adminController.updateAIConfig);

// Notifications/Broadcast
router.post('/broadcast', adminMiddleware, adminController.broadcastNotification);

// System Logs
router.get('/logs', adminMiddleware, adminController.getLogs);

module.exports = router;
