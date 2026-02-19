const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BookingStatusHistory = sequelize.define(
  "BookingStatusHistory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "bookings", key: "id" },
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
      allowNull: false,
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "booking_status_history",
    indexes: [{ fields: ["booking_id"] }, { fields: ["created_at"] }],
  },
);

module.exports = BookingStatusHistory;
