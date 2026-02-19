const router = require("express").Router();
const mechanicController = require("../controllers/mechanic.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

/**
 * @swagger
 * tags:
 *   name: Mechanics
 *   description: Mechanic marketplace & management
 */

/**
 * @swagger
 * /api/v1/mechanics:
 *   get:
 *     summary: List all mechanics
 *     tags: [Mechanics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [online, offline, busy]
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *     responses:
 *       200:
 *         description: Paginated mechanic list
 */
router.get("/", mechanicController.getAll);

/**
 * @swagger
 * /api/v1/mechanics/nearby:
 *   get:
 *     summary: Find nearby mechanics
 *     tags: [Mechanics]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Radius in km
 *     responses:
 *       200:
 *         description: List of nearby mechanics with distance
 */
router.get("/nearby", mechanicController.getNearby);

/**
 * @swagger
 * /api/v1/mechanics/profile:
 *   put:
 *     summary: Update mechanic profile
 *     tags: [Mechanics]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bio:
 *                 type: string
 *               experienceYears:
 *                 type: integer
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               ktpNumber:
 *                 type: string
 *                 example: "3201234567890001"
 *                 description: Nomor KTP (NIK)
 *               bankName:
 *                 type: string
 *                 example: BCA
 *               bankAccountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               bankAccountName:
 *                 type: string
 *                 example: John Doe
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile",
  authenticate,
  authorize("mechanic"),
  mechanicController.updateProfile,
);

/**
 * @swagger
 * /api/v1/mechanics/status:
 *   patch:
 *     summary: Toggle mechanic online/offline status
 *     tags: [Mechanics]
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
 *                 enum: [online, offline]
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch(
  "/status",
  authenticate,
  authorize("mechanic"),
  mechanicController.updateStatus,
);

/**
 * @swagger
 * /api/v1/mechanics/services:
 *   post:
 *     summary: Add a service to mechanic profile
 *     tags: [Mechanics]
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
  authorize("mechanic"),
  mechanicController.addService,
);

/**
 * @swagger
 * /api/v1/mechanics/services/{serviceId}:
 *   delete:
 *     summary: Remove a service from mechanic profile
 *     tags: [Mechanics]
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
  authorize("mechanic"),
  mechanicController.removeService,
);

/**
 * @swagger
 * /api/v1/mechanics/wallet:
 *   get:
 *     summary: Get mechanic wallet balance
 *     tags: [Mechanics]
 *     responses:
 *       200:
 *         description: Wallet info
 */
router.get(
  "/wallet",
  authenticate,
  authorize("mechanic"),
  mechanicController.getWallet,
);

/**
 * @swagger
 * /api/v1/mechanics/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     tags: [Mechanics]
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
 *         description: Paginated wallet transactions
 */
router.get(
  "/wallet/transactions",
  authenticate,
  authorize("mechanic"),
  mechanicController.getWalletTransactions,
);

/**
 * @swagger
 * /api/v1/mechanics/wallet/withdraw:
 *   post:
 *     summary: Request a withdrawal
 *     tags: [Mechanics]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, bankName, bankAccountNumber, bankAccountName]
 *             properties:
 *               amount:
 *                 type: number
 *               bankName:
 *                 type: string
 *               bankAccountNumber:
 *                 type: string
 *               bankAccountName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal request submitted
 */
router.post(
  "/wallet/withdraw",
  authenticate,
  authorize("mechanic"),
  mechanicController.requestWithdrawal,
);

/**
 * @swagger
 * /api/v1/mechanics/{id}:
 *   get:
 *     summary: Get mechanic detail
 *     tags: [Mechanics]
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
 *         description: Mechanic detail
 */
router.get("/:id", mechanicController.getById);

module.exports = router;
