const { pool } = require('../config/db');

class ChatModel {
  static async saveMessage({ userId = null, sessionId, role, message }) {
    const [res] = await pool.query(
      'INSERT INTO chat_history (user_id, session_id, role, message) VALUES (?, ?, ?, ?)',
      [userId, sessionId, role, message]
    );
    return res.insertId;
  }

  static async getHistory(sessionId, limit = 20) {
    const [rows] = await pool.query(
      `SELECT id, user_id, session_id, role, message, created_at 
       FROM chat_history 
       WHERE session_id = ? 
       ORDER BY created_at ASC 
       LIMIT ?`,
      [sessionId, parseInt(limit, 10)]
    );
    return rows;
  }

  static async clearHistory(sessionId) {
    const [res] = await pool.query(
      'DELETE FROM chat_history WHERE session_id = ?',
      [sessionId]
    );
    return res.affectedRows > 0;
  }
}

module.exports = ChatModel;

