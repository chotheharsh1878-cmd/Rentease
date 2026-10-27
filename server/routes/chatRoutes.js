const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiter');

router.post('/', chatLimiter, optionalAuth, chatController.handleChat);
router.get('/history', chatController.getChatHistory);
router.delete('/history', chatController.clearChatHistory);

module.exports = router;

