const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, User } = require('../models');

let io;
const onlineUsers = new Map(); // userId -> Set of socketIds

const initSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*", // Allow all origins for simplicity in this setup
      methods: ["GET", "POST"]
    }
  });

  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`User connected: ${userId} (${socket.user.name})`);
    
    // Join a room specifically for this user
    socket.join(`user_${userId}`);

    // Track online status
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Broadcast if this is the first session for this user
    if (onlineUsers.get(userId).size === 1) {
      socket.broadcast.emit('user_status_change', { userId, status: 'online' });
    }

    // Send current online users to the newly connected user
    const onlineUserIds = Array.from(onlineUsers.keys());
    socket.emit('online_users_list', onlineUserIds);

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        
        // Save to Database
        const message = await Message.create({
          senderId: userId,
          receiverId,
          content,
          read: false
        });

        // Fetch full message with associations to return consistent data
        const fullMessage = await Message.findByPk(message.id, {
            include: [
                { model: User, as: 'Sender', attributes: ['id', 'name'] },
                { model: User, as: 'Receiver', attributes: ['id', 'name'] }
            ]
        });

        // Emit to receiver
        io.to(`user_${receiverId}`).emit('receive_message', fullMessage);
        
        // Emit back to sender (so they know it was saved/sent confirm) - optional if using optimistic UI
        socket.emit('message_sent', fullMessage);

      } catch (error) {
        console.error('Error sending message:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${userId}`);
      if (onlineUsers.has(userId)) {
        onlineUsers.get(userId).delete(socket.id);
        
        if (onlineUsers.get(userId).size === 0) {
          onlineUsers.delete(userId);
          io.emit('user_status_change', { userId, status: 'offline' });
        }
      }
    });
  });

  return io;
};

module.exports = initSocket;
