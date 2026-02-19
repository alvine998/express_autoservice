const router = require("express").Router();
const serviceCategoryController = require("../controllers/serviceCategory.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Service Categories
 *   description: Service category & service management
 */

/**
 * @swagger
 * /api/v1/service-categories:
 *   get:
 *     summary: List all service categories
 *     tags: [Service Categories]
 *     security: []
 *     responses:
 *       200:
 *         description: List of categories with services
 *   post:
 *     summary: Create a service category (admin only)
 *     tags: [Service Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Engine Repair
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Category created
 */
router.get("/", serviceCategoryController.getAll);
router.get("/:id", serviceCategoryController.getById);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  serviceCategoryController.create,
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  serviceCategoryController.update,
);

/**
 * @swagger
 * /api/v1/services:
 *   get:
 *     summary: List all services
 *     tags: [Service Categories]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of services
 *   post:
 *     summary: Create a service (admin only)
 *     tags: [Service Categories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryId, name]
 *             properties:
 *               categoryId:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               estimatedDuration:
 *                 type: integer
 *                 description: Duration in minutes
 *               basePrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Service created
 */

module.exports = router;
