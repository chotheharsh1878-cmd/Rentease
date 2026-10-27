const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { authenticate, optionalAuth, requireRole } = require('../middleware/authMiddleware');

// Public routes
router.get('/', propertyController.getProperties);
router.get('/featured', propertyController.getFeaturedProperties);

// Owner route to get their properties
router.get('/my', authenticate, requireRole('owner', 'admin'), propertyController.getMyProperties);

// Specific property details (with optional auth to detect favorite)
router.get('/:id', optionalAuth, propertyController.getPropertyById);

// Owner / Admin property management
router.post('/', authenticate, requireRole('owner', 'admin'), propertyController.createProperty);
router.put('/:id', authenticate, requireRole('owner', 'admin'), propertyController.updateProperty);
router.delete('/:id', authenticate, requireRole('owner', 'admin'), propertyController.deleteProperty);

module.exports = router;

