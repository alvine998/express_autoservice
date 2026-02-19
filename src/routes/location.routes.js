const router = require("express").Router();
const locationController = require("../controllers/location.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Location
 *   description: Mechanic location tracking
 */

/**
 * @swagger
 * /api/v1/locations/track:
 *   post:
 *     summary: Log mechanic's current location
 *     tags: [Location]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               accuracy:
 *                 type: number
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Location tracked
 */
router.post(
  "/track",
  authenticate,
  authorize("mechanic"),
  locationController.track,
);

/**
 * @swagger
 * /api/v1/locations/booking/{bookingId}:
 *   get:
 *     summary: Get location history for a booking
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Location log entries
 */
router.get(
  "/booking/:bookingId",
  authenticate,
  locationController.getBookingLocations,
);

/**
 * @swagger
 * /api/v1/locations/mechanic/{mechanicId}/latest:
 *   get:
 *     summary: Get mechanic's latest location
 *     tags: [Location]
 *     parameters:
 *       - in: path
 *         name: mechanicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Latest location
 */
router.get(
  "/mechanic/:mechanicId/latest",
  authenticate,
  locationController.getMechanicLatestLocation,
);

module.exports = router;
