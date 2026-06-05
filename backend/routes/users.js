const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');
const { verifyToken, verifyAdminToken } = require('../middleware/authMiddleware');

// Public routes (không cần xác thực)
router.post('/register/admin', usersController.registerAdmin);
router.post('/register', usersController.register);
router.post('/login', usersController.login);
router.post('/login/google', usersController.googleLoginWithIdToken);
router.post('/login/google/code', usersController.googleLoginWithCode);

// Protected routes (cần xác thực token)
router.get('/current-shop', verifyToken, usersController.getCurrentShopApiKey);
router.put('/current-shop/regenerate-key', verifyToken, usersController.regenerateApiKey);
router.get('/staff', verifyAdminToken, usersController.getStaffs);
router.post('/', verifyAdminToken, usersController.createStaff);
router.get('/', verifyAdminToken, usersController.getAllUsers);
router.get('/:id', verifyAdminToken, usersController.getUserById);
router.put('/:id', verifyAdminToken, usersController.updateStaff);
router.delete('/:id', verifyAdminToken, usersController.deleteStaff);

module.exports = router;
