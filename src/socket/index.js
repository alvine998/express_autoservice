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

    socket.on("chat:message", async (data) => {
      try {
        const { chatId, message, messageType } = data;

        // Save to database
        const { ChatMessage, User } = require("../models");
        const chatMessage = await ChatMessage.create({
          chatId,
          senderId: socket.user.id,
          message,
          messageType: messageType || "text",
        });

        const fullMessage = await ChatMessage.findByPk(chatMessage.id, {
          include: [
            {
              model: User,
              as: "sender",
              attributes: ["id", "fullName", "avatarUrl"],
            },
          ],
        });

        // Broadcast to chat room (including sender for confirmation)
        io.to(`chat:${chatId}`).emit("chat:message", fullMessage);
      } catch (error) {
        console.error("Socket chat:message error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
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
