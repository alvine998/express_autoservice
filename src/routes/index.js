const router = require("express").Router();
const serviceCategoryController = require("../controllers/serviceCategory.controller");
const authenticate = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const mechanicRoutes = require("./mechanic.routes");
const workshopRoutes = require("./workshop.routes");
const serviceCategoryRoutes = require("./serviceCategory.routes");
const bookingRoutes = require("./booking.routes");
const transactionRoutes = require("./transaction.routes");
const reviewRoutes = require("./review.routes");
const chatRoutes = require("./chat.routes");
const notificationRoutes = require("./notification.routes");
const locationRoutes = require("./location.routes");
const verificationRoutes = require("./verification.routes");
const adminRoutes = require("./admin.routes");

// Mount routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/mechanics", mechanicRoutes);
router.use("/workshops", workshopRoutes);
router.use("/service-categories", serviceCategoryRoutes);
router.use("/bookings", bookingRoutes);
router.use("/transactions", transactionRoutes);
router.use("/reviews", reviewRoutes);
router.use("/chats", chatRoutes);
router.use("/notifications", notificationRoutes);
router.use("/locations", locationRoutes);
router.use("/verifications", verificationRoutes);
router.use("/admin", adminRoutes);

// Service routes (mounted at /api/v1/services)
router.get("/services", serviceCategoryController.getAllServices);
router.post(
  "/services",
  authenticate,
  authorize("admin"),
  serviceCategoryController.createService,
);

module.exports = router;
