/**
 * Standalone script to sync database schema.
 * Usage: npm run db:sync
 */
require("dotenv").config();

const { sequelize } = require("../models");

const sync = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Use { force: true } to DROP & recreate all tables (destructive!)
    // Use { alter: true } to update tables to match models
    await sequelize.sync({ alter: true });
    console.log("✅ All models synchronized (alter mode)");

    process.exit(0);
  } catch (error) {
    console.error("❌ Database sync failed:", error.message);
    process.exit(1);
  }
};

sync();
