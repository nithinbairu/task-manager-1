const express = require('express');
const router = express.Router();
const { predictNextCategoryAI, generateDescription, generateAdminReport } = require('../controllers/aiController');

router.get('/predict-category/:userId', predictNextCategoryAI);
router.post('/generate-description', generateDescription);
router.get('/admin-report', generateAdminReport);

module.exports = router;
