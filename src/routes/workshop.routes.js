const router = require("express").Router();
const workshopController = require("../controllers/workshop.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Workshops
 *   description: Workshop listings & management
 */

/**
 * @swagger
 * /api/v1/workshops:
 *   get:
 *     summary: List all workshops
 *     tags: [Workshops]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated workshop list
 */
router.get("/", workshopController.getAll);

/**
 * @swagger
 * /api/v1/workshops/profile:
 *   put:
 *     summary: Update workshop profile
 *     tags: [Workshops]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               phone:
 *                 type: string
 *               operatingHoursStart:
 *                 type: string
 *                 example: "08:00"
 *               operatingHoursEnd:
 *                 type: string
 *                 example: "17:00"
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  authenticate,
  authorize("workshop_owner"),
  workshopController.updateProfile,
);

/**
 * @swagger
 * /api/v1/workshops/services:
 *   post:
 *     summary: Add a service to workshop
 *     tags: [Workshops]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [serviceId, price]
 *             properties:
 *               serviceId:
 *                 type: string
 *                 format: uuid
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Service added
 */
router.post(
  "/services",
  authenticate,
  authorize("workshop_owner"),
  workshopController.addService,
);

/**
 * @swagger
 * /api/v1/workshops/services/{serviceId}:
 *   delete:
 *     summary: Remove a service from workshop
 *     tags: [Workshops]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service removed
 */
router.delete(
  "/services/:serviceId",
  authenticate,
  authorize("workshop_owner"),
  workshopController.removeService,
);

/**
 * @swagger
 * /api/v1/workshops/{id}:
 *   get:
 *     summary: Get workshop detail
 *     tags: [Workshops]
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
 *         description: Workshop detail
 */
router.get("/:id", workshopController.getById);

module.exports = router;
