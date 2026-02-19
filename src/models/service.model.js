const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "service_categories", key: "id" },
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimatedDuration: {
      type: DataTypes.INTEGER, // in minutes
      allowNull: true,
    },
    basePrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "services",
    indexes: [{ fields: ["category_id"] }, { fields: ["name"] }],
  },
);

module.exports = Service;
