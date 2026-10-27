const express = require('express');
const router = express.Router();
const inquiryController = require('../controllers/inquiryController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate);

// Tenant submits inquiry
router.post('/', inquiryController.createInquiry);

// Tenant retrieves their inquiries
router.get('/my', inquiryController.getMyInquiries);

// Owner retrieves inquiries for their listings
router.get('/owner', requireRole('owner', 'admin'), inquiryController.getOwnerInquiries);

// Get single inquiry with conversation thread
router.get('/:id', inquiryController.getInquiryById);

// Update status (e.g., accepted, rejected)
router.patch('/:id/status', inquiryController.updateInquiryStatus);

// Reply to inquiry
router.post('/:id/replies', inquiryController.addReply);

module.exports = router;

