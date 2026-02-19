const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "bookings", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    platformFee: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    mechanicEarnings: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM("pending", "held", "released", "refunded"),
      defaultValue: "pending",
    },
    paymentMethod: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    paymentReference: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    escrowHeldAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    escrowReleasedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    refundedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "transactions",
    indexes: [
      { fields: ["booking_id"], unique: true },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Transaction;
