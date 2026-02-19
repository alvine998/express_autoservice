const router = require("express").Router();
const verificationController = require("../controllers/verification.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: Mechanic KTP & selfie verification
 */

/**
 * @swagger
 * /api/v1/verifications/submit:
 *   post:
 *     summary: Submit verification documents (KTP + selfie)
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [ktpNumber, ktpImage, selfieImage]
 *             properties:
 *               ktpNumber:
 *                 type: string
 *               ktpImage:
 *                 type: string
 *                 format: binary
 *               selfieImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Verification submitted
 */
router.post(
  "/submit",
  authenticate,
  authorize("mechanic"),
  upload.fields([
    { name: "ktpImage", maxCount: 1 },
    { name: "selfieImage", maxCount: 1 },
  ]),
  verificationController.submit,
);

/**
 * @swagger
 * /api/v1/verifications/{mechanicId}:
 *   get:
 *     summary: Get verification status for a mechanic
 *     tags: [Verification]
 *     parameters:
 *       - in: path
 *         name: mechanicId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Verification details
 */
router.get("/:mechanicId", authenticate, verificationController.getByMechanic);

/**
 * @swagger
 * /api/v1/verifications/{id}/review:
 *   patch:
 *     summary: Admin approve/reject verification
 *     tags: [Verification]
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
 *                 enum: [approved, rejected]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Verification reviewed
 */
router.patch(
  "/:id/review",
  authenticate,
  authorize("admin"),
  verificationController.review,
);

module.exports = router;
