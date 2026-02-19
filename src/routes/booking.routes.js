const router = require("express").Router();
const bookingController = require("../controllers/booking.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Booking lifecycle management
 */

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, address, latitude, longitude]
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               bookingType:
 *                 type: string
 *                 enum: [instant, scheduled]
 *                 default: instant
 *               scheduledAt:
 *                 type: string
 *                 format: date-time
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               problemDescription:
 *                 type: string
 *               workshopId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Booking created
 *   get:
 *     summary: List bookings (role-aware)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, searching, offered, accepted, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Paginated booking list
 */
router.post("/", authenticate, bookingController.create);
router.get("/", authenticate, bookingController.getAll);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Get booking detail
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Booking detail with offers, status history, and transaction
 */
router.get("/:id", authenticate, bookingController.getById);

/**
 * @swagger
 * /api/v1/bookings/{id}/offers:
 *   post:
 *     summary: Send offer to a mechanic
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [mechanicId, price]
 *             properties:
 *               mechanicId:
 *                 type: string
 *                 format: uuid
 *               price:
 *                 type: number
 *               estimatedDuration:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Offer sent
 */
router.post("/:id/offers", authenticate, bookingController.createOffer);

/**
 * @swagger
 * /api/v1/bookings/offers/{offerId}:
 *   put:
 *     summary: Accept or reject an offer
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: offerId
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Offer response recorded
 */
router.put("/offers/:offerId", authenticate, bookingController.respondToOffer);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [searching, in_progress, completed, cancelled]
 *               note:
 *                 type: string
 *               cancellationReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch("/:id/status", authenticate, bookingController.updateStatus);

/**
 * @swagger
 * /api/v1/bookings/{id}/price:
 *   patch:
 *     summary: Set final price for booking
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
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
 *             required: [finalPrice]
 *             properties:
 *               finalPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Final price set
 */
router.patch("/:id/price", authenticate, bookingController.setFinalPrice);

module.exports = router;
