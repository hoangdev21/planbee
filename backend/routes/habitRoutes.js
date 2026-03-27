const express = require('express');
const router = express.Router();
const habitController = require('../controllers/habitController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/all', habitController.getHabits);
router.post('/add', habitController.createHabit);
router.post('/check-in/:id', habitController.checkIn);
router.delete('/delete/:id', habitController.deleteHabit);

module.exports = router;
