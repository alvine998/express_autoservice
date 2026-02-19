const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MechanicService = sequelize.define(
  "MechanicService",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    mechanicId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "mechanics", key: "id" },
    },
    serviceId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "services", key: "id" },
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "mechanic_services",
    indexes: [
      { fields: ["mechanic_id"] },
      { fields: ["service_id"] },
      { fields: ["mechanic_id", "service_id"], unique: true },
    ],
  },
);

module.exports = MechanicService;
