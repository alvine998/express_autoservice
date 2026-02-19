const jwt = require("jsonwebtoken");

/**
 * Socket.IO event handlers for real-time features
 */
module.exports = (io) => {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error("Authentication token required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.id} (${socket.user.role})`);

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // ---- Booking events ----
    socket.on("booking:join", (bookingId) => {
      socket.join(`booking:${bookingId}`);
      console.log(`User ${socket.user.id} joined booking room: ${bookingId}`);
    });

    socket.on("booking:leave", (bookingId) => {
      socket.leave(`booking:${bookingId}`);
    });

    // ---- Chat events ----
    socket.on("chat:join", (chatId) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${socket.user.id} joined chat room: ${chatId}`);
    });

    socket.on("chat:message", (data) => {
      // Broadcast to chat room
      socket.to(`chat:${data.chatId}`).emit("chat:message", {
        chatId: data.chatId,
        senderId: socket.user.id,
        message: data.message,
        messageType: data.messageType || "text",
        createdAt: new Date(),
      });
    });

    socket.on("chat:typing", (data) => {
      socket.to(`chat:${data.chatId}`).emit("chat:typing", {
        chatId: data.chatId,
        userId: socket.user.id,
        isTyping: data.isTyping,
      });
    });

    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ---- Mechanic location tracking ----
    socket.on("mechanic:locationUpdate", (data) => {
      // Broadcast to relevant booking room
      if (data.bookingId) {
        socket.to(`booking:${data.bookingId}`).emit("mechanic:locationUpdate", {
          mechanicId: socket.user.id,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date(),
        });
      }
    });

    // ---- Disconnect ----
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${socket.user.id}`);
    });
  });

  // Helper to emit to specific user
  io.emitToUser = (userId, event, data) => {
    io.to(`user:${userId}`).emit(event, data);
  };

  // Helper to emit to booking room
  io.emitToBooking = (bookingId, event, data) => {
    io.to(`booking:${bookingId}`).emit(event, data);
  };

  return io;
};
