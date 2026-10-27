const ChatModel = require('../models/chatModel');
const AiChatService = require('../services/aiChatService');
const crypto = require('crypto');

exports.handleChat = async (req, res, next) => {
  try {
    const { message } = req.body;
    let { sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    const userId = req.user ? req.user.id : null;
    let history = [];

    // 1. Save user query to MySQL chat_history (if connected)
    try {
      await ChatModel.saveMessage({
        userId,
        sessionId,
        role: 'user',
        message: message.trim()
      });
      // 2. Fetch recent conversation history
      history = await ChatModel.getHistory(sessionId, 6);
    } catch (saveErr) {
      console.warn('⚠️ Could not log chat to MySQL chat_history:', saveErr.message);
    }

    // 3. Process chat with AI service + MySQL data
    const result = await AiChatService.processChat({
      message: message.trim(),
      history
    });

    // 4. Save assistant answer to MySQL chat_history (if connected)
    try {
      await ChatModel.saveMessage({
        userId,
        sessionId,
        role: 'assistant',
        message: result.reply
      });
    } catch (saveErr) {
      // Ignored if DB is disconnected
    }

    res.json({
      success: true,
      sessionId,
      ...result
    });
  } catch (error) {
    next(error);
  }
};

exports.getChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.json({
        success: true,
        history: []
      });
    }

    const history = await ChatModel.getHistory(sessionId, 50);
    res.json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

exports.clearChatHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.query;

    if (sessionId) {
      await ChatModel.clearHistory(sessionId);
    }

    res.json({
      success: true,
      message: 'Chat history cleared successfully.'
    });
  } catch (error) {
    next(error);
  }
};

