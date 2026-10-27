const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

router.post('/', visitController.createBooking);
router.get('/my', visitController.getMyVisits);
router.get('/owner', requireRole('owner', 'admin'), visitController.getOwnerVisits);
router.patch('/:id/status', visitController.updateVisitStatus);
router.delete('/:id', visitController.cancelVisit);

module.exports = router;

