const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/all', planController.getPlans);
router.post('/add', planController.createPlan);
router.delete('/delete/:id', planController.deletePlan);
router.put('/update/:id', planController.updatePlan);

module.exports = router;
