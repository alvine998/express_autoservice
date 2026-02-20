const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Workshop = sequelize.define(
  "Workshop",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "users", key: "id" },
    },
    status: {
      type: DataTypes.ENUM("online", "offline"),
      defaultValue: "offline",
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    operatingHoursStart: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    operatingHoursEnd: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "workshops",
    indexes: [
      { fields: ["user_id"], unique: true },
      { fields: ["latitude", "longitude"] },
      { fields: ["status"] },
      { fields: ["is_active"] },
      { fields: ["rating"] },
    ],
  },
);

module.exports = Workshop;
