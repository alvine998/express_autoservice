const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Booking = sequelize.define(
  "Booking",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    mechanicId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "mechanics", key: "id" },
    },
    workshopId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "workshops", key: "id" },
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "services", key: "id" },
    },
    bookingType: {
      type: DataTypes.ENUM("instant", "scheduled"),
      allowNull: false,
      defaultValue: "instant",
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "searching",
        "offered",
        "accepted",
        "in_progress",
        "completed",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    problemDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    finalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "bookings",
    indexes: [
      { fields: ["user_id"] },
      { fields: ["mechanic_id"] },
      { fields: ["workshop_id"] },
      { fields: ["service_id"] },
      { fields: ["status"] },
      { fields: ["booking_type"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Booking;
