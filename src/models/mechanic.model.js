const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Mechanic = sequelize.define(
  "Mechanic",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("online", "offline", "busy"),
      defaultValue: "offline",
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    experienceYears: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totalJobsCompleted: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ktpNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: "Nomor KTP (NIK)",
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    bankAccountName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "mechanics",
    indexes: [
      { fields: ["user_id"], unique: true },
      { fields: ["status"] },
      { fields: ["latitude", "longitude"] },
      { fields: ["is_verified"] },
      { fields: ["rating"] },
    ],
  },
);

module.exports = Mechanic;
