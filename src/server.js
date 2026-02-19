require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const { sequelize } = require("./models");
const setupSocket = require("./socket");

const PORT = process.env.PORT || 3000;

// Create HTTP server & attach Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Setup Socket.IO event handlers
setupSocket(io);

// Make io accessible in controllers (via req.app)
app.set("io", io);

// ============================================================
// START SERVER
// ============================================================
const start = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync database (creates tables if not exist)
    await sequelize.sync({ alter: false });
    console.log("✅ Database models synchronized");

    server.listen(PORT, () => {
      console.log(`\n🚀 Auto Services API running on port ${PORT}`);
      console.log(`📖 Swagger Docs: http://localhost:${PORT}/api-docs`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO ready\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

start();
