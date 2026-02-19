const { Chat, ChatMessage, Booking, User, Mechanic } = require("../models");
const ApiError = require("../utils/apiError");
const { success, created, paginated } = require("../utils/apiResponse");

/**
 * GET /api/v1/chats/booking/:bookingId — Get or create chat for a booking
 */
exports.getOrCreateByBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.bookingId, {
      include: [{ model: Mechanic, as: "mechanic" }],
    });

    if (!booking) throw ApiError.notFound("Booking not found");
    if (!booking.mechanicId)
      throw ApiError.badRequest("No mechanic assigned yet");

    let chat = await Chat.findOne({ where: { bookingId: booking.id } });

    if (!chat) {
      const mechanic = await Mechanic.findByPk(booking.mechanicId);
      chat = await Chat.create({
        bookingId: booking.id,
        userId: booking.userId,
        mechanicUserId: mechanic.userId,
      });
    }

    return success(res, chat);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/chats/:chatId/messages
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) throw ApiError.notFound("Chat not found");

    const result = await ChatMessage.findAndCountAll({
      where: { chatId: chat.id },
      include: [
        {
          model: User,
          as: "sender",
          attributes: ["id", "fullName", "avatarUrl"],
        },
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [["createdAt", "ASC"]],
    });

    return paginated(res, { ...result, page, limit });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chats/:chatId/messages
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { message, messageType } = req.body;

    const chat = await Chat.findByPk(req.params.chatId);
    if (!chat) throw ApiError.notFound("Chat not found");

    // Verify user is part of this chat
    if (chat.userId !== req.user.id && chat.mechanicUserId !== req.user.id) {
      throw ApiError.forbidden("You are not part of this chat");
    }

    const chatMessage = await ChatMessage.create({
      chatId: chat.id,
      senderId: req.user.id,
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

    // Broadcast via Socket.IO
    const io = req.app.get("io");
    if (io) {
      io.to(`chat:${chat.id}`).emit("chat:message", fullMessage);
    }

    return created(res, fullMessage, "Message sent");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/chats/upload
 * Upload chat image
 */
exports.uploadChatImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw ApiError.badRequest("Please upload an image");
    }

    // Return the relative path of the uploaded file
    const imageUrl = `/uploads/${req.file.filename}`;

    return success(res, { imageUrl }, "Image uploaded successfully");
  } catch (error) {
    next(error);
  }
};
