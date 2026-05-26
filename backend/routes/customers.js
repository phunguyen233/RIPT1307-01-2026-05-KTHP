const express = require('express');
const router = express.Router();
const customersController = require('../controllers/customers');
const { verifyTokenOrApiKey } = require('../middleware/authMiddleware');

// Public routes (accessible with API key or token)
router.get('/', verifyTokenOrApiKey, customersController.getAllCustomers);
router.get('/:id', verifyTokenOrApiKey, customersController.getCustomerById);
router.post('/', verifyTokenOrApiKey, customersController.createCustomer);
router.put('/:id', verifyTokenOrApiKey, customersController.updateCustomer);
router.delete('/:id', verifyTokenOrApiKey, customersController.deleteCustomer);

module.exports = router;
