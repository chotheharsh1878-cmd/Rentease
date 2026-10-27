const express = require('express');
const router = express.Router();
const globalPropertyController = require('../controllers/globalPropertyController');

router.get('/', globalPropertyController.searchGlobalProperties);
router.get('/:id', globalPropertyController.getGlobalPropertyById);

module.exports = router;

