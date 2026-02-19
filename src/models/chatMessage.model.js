const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ChatMessage = sequelize.define(
  "ChatMessage",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chatId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "chats", key: "id" },
    },
    senderId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    messageType: {
      type: DataTypes.ENUM("text", "image", "location"),
      defaultValue: "text",
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "chat_messages",
    indexes: [
      { fields: ["chat_id"] },
      { fields: ["sender_id"] },
      { fields: ["created_at"] },
    ],
  },
);

module.exports = ChatMessage;
