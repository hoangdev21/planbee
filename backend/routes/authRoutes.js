const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Private
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile/update', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);
router.put('/settings/update', authMiddleware, authController.updateSettings);
router.post('/unlink-telegram', authMiddleware, authController.unlinkTelegram);
router.post('/logout', authController.logout);

module.exports = router;
