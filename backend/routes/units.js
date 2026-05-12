const express = require('express');
const router = express.Router();
const unitsController = require('../controllers/units');
const { verifyTokenOrApiKey } = require('../middleware/authMiddleware');

router.get('/', verifyTokenOrApiKey, unitsController.getAllUnits);
router.get('/:id', verifyTokenOrApiKey, unitsController.getUnitById);
router.post('/', unitsController.createUnit);
router.put('/:id', unitsController.updateUnit);
router.delete('/:id', unitsController.deleteUnit);

module.exports = router;
