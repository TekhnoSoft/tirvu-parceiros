const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const { Message, User } = require('../models');

let io;

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
    console.log(`User connected: ${socket.user.id} (${socket.user.name})`);
    
    // Join a room specifically for this user
    socket.join(`user_${socket.user.id}`);

    // Handle sending messages
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, content } = data;
        
        // Save to Database
        const message = await Message.create({
          senderId: socket.user.id,
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
      console.log('User disconnected');
    });
  });

  return io;
};

module.exports = initSocket;
