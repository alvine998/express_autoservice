const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BookingOffer = sequelize.define(
  "BookingOffer",
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
    mechanicId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "mechanics", key: "id" },
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    estimatedDuration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "accepted", "rejected", "expired"),
      defaultValue: "pending",
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "booking_offers",
    indexes: [
      { fields: ["booking_id"] },
      { fields: ["mechanic_id"] },
      { fields: ["status"] },
      { fields: ["expires_at"] },
    ],
  },
);

module.exports = BookingOffer;
