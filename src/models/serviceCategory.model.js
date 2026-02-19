const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ServiceCategory = sequelize.define(
  "ServiceCategory",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "service_categories",
    indexes: [{ fields: ["name"], unique: true }],
  },
);

module.exports = ServiceCategory;
