const router = require("express").Router();
const reviewController = require("../controllers/review.controller");
const authenticate = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Rating & review system
 */

/**
 * @swagger
 * /api/v1/reviews:
 *   post:
 *     summary: Submit a review for a completed booking
 *     tags: [Reviews]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, rating]
 *             properties:
 *               bookingId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review submitted
 */
router.post("/", authenticate, reviewController.create);

/**
 * @swagger
 * /api/v1/reviews/mechanic/{id}:
 *   get:
 *     summary: Get reviews for a mechanic
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated reviews
 */
router.get("/mechanic/:id", reviewController.getMechanicReviews);

/**
 * @swagger
 * /api/v1/reviews/workshop/{id}:
 *   get:
 *     summary: Get reviews for a workshop
 *     tags: [Reviews]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Paginated reviews
 */
router.get("/workshop/:id", reviewController.getWorkshopReviews);

module.exports = router;
