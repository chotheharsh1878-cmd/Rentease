const express = require('express');
const router = express.Router();
const neighborhoodController = require('../controllers/neighborhoodController');

router.get('/', neighborhoodController.getCityProfile);
router.get('/nearby', neighborhoodController.getNearby);

module.exports = router;
