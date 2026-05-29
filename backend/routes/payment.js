const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');

router.get('/checkout', paymentController.checkout);
router.get('/vnpay', paymentController.generateVnPayUrl);
router.post('/sepay/webhook', paymentController.handleSePayWebhook);

module.exports = router;
