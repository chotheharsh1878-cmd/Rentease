const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', favoriteController.getFavorites);
router.get('/ids', favoriteController.getFavoriteIds);
router.post('/:propertyId', favoriteController.addFavorite);
router.delete('/:propertyId', favoriteController.removeFavorite);

module.exports = router;

