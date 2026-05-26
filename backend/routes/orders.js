const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/orders');
const { verifyTokenOrApiKey } = require('../middleware/authMiddleware');

// Public routes (accessible with API key or token)
router.get('/', verifyTokenOrApiKey, ordersController.getAllOrders);
router.get('/:id', verifyTokenOrApiKey, ordersController.getOrderById);
router.post('/', verifyTokenOrApiKey, ordersController.createOrder);
router.put('/:id', verifyTokenOrApiKey, ordersController.updateOrder);
router.put('/:id/status', verifyTokenOrApiKey, ordersController.updateOrderStatus);
router.delete('/:id', verifyTokenOrApiKey, ordersController.deleteOrder);
router.post('/:id/process', verifyTokenOrApiKey, ordersController.processOrder);

module.exports = router;
