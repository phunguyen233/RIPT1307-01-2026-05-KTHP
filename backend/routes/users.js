const express = require('express');
const router = express.Router();
const usersController = require('../controllers/users');

const { verifyToken, verifyAdminToken } = require('../middleware/authMiddleware');

// Public routes (không cần xác thực)
router.post('/register/admin', usersController.registerAdmin);
router.post('/register', usersController.register);
router.post('/login', usersController.login);

// Protected routes (cần xác thực token)
router.get('/current-shop', verifyToken, usersController.getCurrentShopApiKey);
router.put('/current-shop/regenerate-key', verifyToken, usersController.regenerateApiKey);
router.get('/', verifyAdminToken, usersController.getAllUsers);
router.get('/:id', verifyAdminToken, usersController.getUserById);
router.put('/:id', verifyAdminToken, usersController.updateUser);
router.delete('/:id', verifyAdminToken, usersController.deleteUser);

module.exports = router;
