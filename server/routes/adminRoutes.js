const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.use(authenticate, requireRole('admin'));

router.get('/dashboard', adminController.getDashboardStats);
router.get('/users', adminController.getUsers);
router.patch('/users/:id/toggle', adminController.toggleUserActive);
router.delete('/users/:id', adminController.deleteUser);
router.get('/properties/pending', adminController.getPendingProperties);
router.patch('/properties/:id/approval', adminController.updatePropertyApproval);

module.exports = router;

