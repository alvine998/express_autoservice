const router = require("express").Router();
const matchmakingController = require("../controllers/matchmaking.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Matchmaking
 *   description: Matchmaking mechanics to user bookings
 */

/**
 * @swagger
 * /api/v1/matchmaking/{bookingId}:
 *   get:
 *     summary: Find suitable mechanics for a booking
 *     tags: [Matchmaking]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in km
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Max number of mechanics to return
 *     responses:
 *       200:
 *         description: List of suitable mechanics found
 */
router.get("/:bookingId", authenticate, matchmakingController.findMechanics);

/**
 * @swagger
 * /api/v1/matchmaking/{bookingId}/notify:
 *   post:
 *     summary: Notify top suitable mechanics for a booking
 *     tags: [Matchmaking]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               radius:
 *                 type: number
 *                 default: 5
 *               limit:
 *                 type: integer
 *                 default: 5
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Mechanics notified successfully
 */
router.post(
  "/:bookingId/notify",
  authenticate,
  authorize("user", "admin"),
  matchmakingController.notifyMechanics,
);

module.exports = router;
