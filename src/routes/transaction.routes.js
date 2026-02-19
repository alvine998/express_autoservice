const router = require("express").Router();
const transactionController = require("../controllers/transaction.controller");
const authenticate = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Escrow payment management
 */

/**
 * @swagger
 * /api/v1/transactions/{bookingId}:
 *   get:
 *     summary: Get transaction for a booking
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction detail
 */
router.get("/:bookingId", authenticate, transactionController.getByBooking);

/**
 * @swagger
 * /api/v1/transactions/{bookingId}/hold:
 *   post:
 *     summary: Hold funds in escrow
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: bookingId
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
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *               paymentMethod:
 *                 type: string
 *               paymentReference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Funds held in escrow
 */
router.post("/:bookingId/hold", authenticate, transactionController.holdEscrow);

/**
 * @swagger
 * /api/v1/transactions/{bookingId}/release:
 *   post:
 *     summary: Release escrow to mechanic
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Escrow released
 */
router.post(
  "/:bookingId/release",
  authenticate,
  transactionController.releaseEscrow,
);

/**
 * @swagger
 * /api/v1/transactions/{bookingId}/refund:
 *   post:
 *     summary: Refund held escrow
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction refunded
 */
router.post("/:bookingId/refund", authenticate, transactionController.refund);

module.exports = router;
