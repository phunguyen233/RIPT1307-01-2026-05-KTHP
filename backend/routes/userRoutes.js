const express = require('express');
const { registerAdmin, register, login } = require('../controllers/user');

const router = express.Router();

// Admin registration (admin-frontend)
router.post('/register/admin', registerAdmin);

// User registration (shop-frontend / ShopAIApp)
router.post('/register', register);

// Login
router.post('/login', login);

module.exports = router;
