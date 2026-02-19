const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MechanicWallet = sequelize.define(
  "MechanicWallet",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mechanicId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "mechanics", key: "id" },
    },
    balance: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
    totalWithdrawn: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0,
    },
  },
  {
    tableName: "mechanic_wallets",
    indexes: [{ fields: ["mechanic_id"], unique: true }],
  },
);

module.exports = MechanicWallet;
