const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MechanicVerification = sequelize.define(
  "MechanicVerification",
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
    ktpNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    ktpImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    selfieImageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "mechanic_verifications",
    indexes: [
      { fields: ["mechanic_id"], unique: true },
      { fields: ["status"] },
    ],
  },
);

module.exports = MechanicVerification;
