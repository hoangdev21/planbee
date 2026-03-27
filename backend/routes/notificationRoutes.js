const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/all', authMiddleware, NotificationController.getAll);
router.put('/mark-as-read', authMiddleware, NotificationController.markAsRead);
router.delete('/delete/:id', authMiddleware, NotificationController.delete);

module.exports = router;
