// File: backend/routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categories');

router.get('/', categoryController.getCategories);
router.post('/', categoryController.addCategory);
router.put('/:id', categoryController.updateCategory); // API Sửa
router.delete('/:id', categoryController.deleteCategory); // API Xoá

module.exports = router;
