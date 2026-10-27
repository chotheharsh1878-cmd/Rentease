const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// Load environment variables before anything else
dotenv.config({ path: path.join(__dirname, '.env') });

const app = require('./app');
const { testConnection } = require('./config/db');
const InquiryModel = require('./models/inquiryModel');

const PORT = process.env.PORT || 5000;
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

const server = http.createServer(app);

// Initialize Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: [allowedOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Real-Time Socket.io event handling
io.on('connection', (socket) => {
  // Join inquiry chat room
  socket.on('join_inquiry_room', (inquiryId) => {
    socket.join(`inquiry_${inquiryId}`);
  });

  // Handle live messaging
  socket.on('send_message', async ({ inquiryId, senderId, senderName, senderRole, message }) => {
    if (!inquiryId || !message || !message.trim()) return;

    try {
      // Save message to MySQL database
      const replyId = await InquiryModel.addReply(inquiryId, senderId, message.trim());

      const payload = {
        id: replyId,
        inquiry_id: inquiryId,
        sender_id: senderId,
        sender_name: senderName,
        sender_role: senderRole,
        message: message.trim(),
        created_at: new Date().toISOString()
      };

      // Broadcast to room (both tenant and owner)
      io.to(`inquiry_${inquiryId}`).emit('receive_message', payload);
    } catch (err) {
      console.error('Socket message save error:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', ({ inquiryId, userName, isTyping }) => {
    socket.to(`inquiry_${inquiryId}`).emit('user_typing', { userName, isTyping });
  });

  // Message read receipts
  socket.on('mark_read', ({ inquiryId, readerId }) => {
    socket.to(`inquiry_${inquiryId}`).emit('message_read', { inquiryId, readerId });
  });

  socket.on('disconnect', () => {
    // disconnected
  });
});

async function startServer() {
  // Test MySQL connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️ Warning: MySQL is not yet reachable. API will start but queries will require active MySQL.');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 ========================================================
   RentEase Server is running successfully!
   - Port: ${PORT}
   - URL:  http://localhost:${PORT}
   - Health check: http://localhost:${PORT}/api/health
   - WebSockets: Real-Time Live Chat (Socket.io) Active
   - Global Rentals API: Active
   - Database: MySQL (${process.env.DB_NAME || 'rentease'})
========================================================
    `);
  });
}

startServer();
