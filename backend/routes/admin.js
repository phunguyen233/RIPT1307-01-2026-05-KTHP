const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');

router.get('/dashboard', adminController.getDashboardStats);
router.get('/shops', adminController.getShopsStats);
router.get('/admin-users', adminController.getAdminUsers);

module.exports = router;
