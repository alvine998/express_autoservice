const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MechanicWalletTransaction = sequelize.define(
  "MechanicWalletTransaction",
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
    type: {
      type: DataTypes.ENUM("credit", "debit"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    referenceType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: "e.g. booking, withdrawal",
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
  },
  {
    tableName: "mechanic_wallet_transactions",
    indexes: [
      { fields: ["wallet_id"] },
      { fields: ["type"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = MechanicWalletTransaction;
