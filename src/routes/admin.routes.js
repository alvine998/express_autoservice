const router = require("express").Router();
const adminController = require("../controllers/admin.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard & management
 */

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard stats
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get(
  "/dashboard",
  authenticate,
  authorize("admin"),
  adminController.getDashboard,
);

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: List all users
 *     tags: [Admin]
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
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, mechanic, workshop_owner, admin]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *     responses:
 *       200:
 *         description: Paginated user list
 */
router.get(
  "/users",
  authenticate,
  authorize("admin"),
  adminController.getUsers,
);

/**
 * @swagger
 * /api/v1/admin/bookings:
 *   get:
 *     summary: List all bookings (admin view)
 *     tags: [Admin]
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
 *     responses:
 *       200:
 *         description: Paginated booking list
 */
router.get(
  "/bookings",
  authenticate,
  authorize("admin"),
  adminController.getBookings,
);

/**
 * @swagger
 * /api/v1/admin/withdrawals:
 *   get:
 *     summary: List withdrawal requests
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, completed, rejected]
 *     responses:
 *       200:
 *         description: Paginated withdrawal list
 */
router.get(
  "/withdrawals",
  authenticate,
  authorize("admin"),
  adminController.getWithdrawals,
);

/**
 * @swagger
 * /api/v1/admin/withdrawals/{id}:
 *   patch:
 *     summary: Process a withdrawal (approve/reject)
 *     tags: [Admin]
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
 *                 enum: [completed, rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal processed
 */
router.patch(
  "/withdrawals/:id",
  authenticate,
  authorize("admin"),
  adminController.processWithdrawal,
);

module.exports = router;
