const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports');
const { verifyAdminToken } = require('../middleware/authMiddleware');

router.get('/:reportKey', verifyAdminToken, reportsController.getReport);

module.exports = router;