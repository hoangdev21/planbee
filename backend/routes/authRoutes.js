const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Public
router.post('/register', authController.register);
router.post('/login', authController.login);

// Private
router.get('/profile', authMiddleware, authController.getProfile);
router.post('/logout', authController.logout);

module.exports = router;
