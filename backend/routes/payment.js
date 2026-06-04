const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment');
const { verifyTokenOrApiKey } = require('../middleware/authMiddleware');

router.get('/checkout', paymentController.checkout);
router.post('/sepay/webhook', paymentController.handleSePayWebhook);
// Create order + return SePay QR (called from shop frontend)
router.post('/sepay/checkout', verifyTokenOrApiKey, paymentController.createSepayOrder);
// Cancel order (called from QR modal)
router.post('/sepay/:id/cancel', verifyTokenOrApiKey, paymentController.cancelSepayOrder);
// Customer claims they've paid — server will wait for SePay webhook to confirm
router.post('/sepay/:id/mark-paid', verifyTokenOrApiKey, paymentController.markSepayOrderPaid);

module.exports = router;
