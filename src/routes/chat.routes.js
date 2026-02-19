const router = require("express").Router();
const chatController = require("../controllers/chat.controller");
const authenticate = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Real-time chat between user and mechanic
 */

/**
 * @swagger
 * /api/v1/chats/booking/{bookingId}:
 *   get:
 *     summary: Get or create chat for a booking
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Chat object
 */
router.get(
  "/booking/:bookingId",
  authenticate,
  chatController.getOrCreateByBooking,
);

/**
 * @swagger
 * /api/v1/chats/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Paginated messages
 *   post:
 *     summary: Send a message
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [text, image, location]
 *                 default: text
 *     responses:
 *       201:
 *         description: Message sent
 */
const upload = require("../middlewares/upload.middleware");

/**
 * @swagger
 * /api/v1/chats/upload:
 *   post:
 *     summary: Upload a chat image
 *     tags: [Chat]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Image uploaded successfully
 */
router.post(
  "/upload",
  authenticate,
  upload.single("image"),
  chatController.uploadChatImage,
);

router.get("/:chatId/messages", authenticate, chatController.getMessages);
router.post("/:chatId/messages", authenticate, chatController.sendMessage);

module.exports = router;
