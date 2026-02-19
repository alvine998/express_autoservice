const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Review = sequelize.define(
  "Review",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    bookingId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: { model: "bookings", key: "id" },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    mechanicId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "mechanics", key: "id" },
    },
    workshopId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: "workshops", key: "id" },
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "reviews",
    indexes: [
      { fields: ["booking_id"], unique: true },
      { fields: ["user_id"] },
      { fields: ["mechanic_id"] },
      { fields: ["workshop_id"] },
      { fields: ["rating"] },
    ],
  },
);

module.exports = Review;
