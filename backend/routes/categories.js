const express = require('express');
const router = express.Router();
const categoriesController = require('../controllers/categories');
const { verifyToken, verifyTokenOrApiKey } = require('../middleware/authMiddleware');

// Public routes (accessible with API key or token)
router.get('/', verifyTokenOrApiKey, categoriesController.getAllCategories);
router.get('/:id', verifyTokenOrApiKey, categoriesController.getCategoryById);

// Protected routes (require token)
router.post('/', verifyToken, categoriesController.createCategory);
router.put('/:id', verifyToken, categoriesController.updateCategory);
router.delete('/:id', verifyToken, categoriesController.deleteCategory);

module.exports = router;
