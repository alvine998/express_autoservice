const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Withdrawal = sequelize.define(
  "Withdrawal",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    walletId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "mechanic_wallets", key: "id" },
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    bankAccountNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    bankAccountName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "rejected"),
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
  },
  {
    tableName: "withdrawals",
    indexes: [
      { fields: ["wallet_id"] },
      { fields: ["status"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = Withdrawal;
