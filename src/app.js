const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});
app.use("/api/", limiter);

// ============================================================
// BODY PARSING
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ============================================================
// STATIC FILES (uploads)
// ============================================================
app.use("/uploads", express.static("uploads"));

// ============================================================
// API DOCUMENTATION
// ============================================================
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Auto Services API Docs",
  }),
);

// ============================================================
// ROUTES
// ============================================================
app.use("/api/v1", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
});

// ============================================================
// ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

module.exports = app;
