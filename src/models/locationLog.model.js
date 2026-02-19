const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const LocationLog = sequelize.define(
  "LocationLog",
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
    bookingId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "bookings", key: "id" },
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false,
    },
    accuracy: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      comment: "GPS accuracy in meters",
    },
  },
  {
    tableName: "location_logs",
    indexes: [
      { fields: ["mechanic_id"] },
      { fields: ["booking_id"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = LocationLog;
