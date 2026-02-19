const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const WorkshopService = sequelize.define(
  "WorkshopService",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    workshopId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "workshops", key: "id" },
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
    tableName: "workshop_services",
    indexes: [
      { fields: ["workshop_id"] },
      { fields: ["service_id"] },
      { fields: ["workshop_id", "service_id"], unique: true },
    ],
  },
);

module.exports = WorkshopService;
