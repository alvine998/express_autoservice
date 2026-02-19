const sequelize = require("../config/database");

// Import all models
const User = require("./user.model");
const Mechanic = require("./mechanic.model");
const Workshop = require("./workshop.model");
const ServiceCategory = require("./serviceCategory.model");
const Service = require("./service.model");
const MechanicService = require("./mechanicService.model");
const WorkshopService = require("./workshopService.model");
const Booking = require("./booking.model");
const BookingStatusHistory = require("./bookingStatusHistory.model");
const BookingOffer = require("./bookingOffer.model");
const Transaction = require("./transaction.model");
const MechanicWallet = require("./mechanicWallet.model");
const MechanicWalletTransaction = require("./mechanicWalletTransaction.model");
const Withdrawal = require("./withdrawal.model");
const Review = require("./review.model");
const Notification = require("./notification.model");
const Chat = require("./chat.model");
const ChatMessage = require("./chatMessage.model");
const LocationLog = require("./locationLog.model");
const MechanicVerification = require("./mechanicVerification.model");

// ============================================================
// ASSOCIATIONS
// ============================================================

// --- User <-> Mechanic ---
User.hasOne(Mechanic, { foreignKey: "userId", as: "mechanic" });
Mechanic.belongsTo(User, { foreignKey: "userId", as: "user" });

// --- User <-> Workshop ---
User.hasOne(Workshop, { foreignKey: "userId", as: "workshop" });
Workshop.belongsTo(User, { foreignKey: "userId", as: "user" });

// --- ServiceCategory <-> Service ---
ServiceCategory.hasMany(Service, { foreignKey: "categoryId", as: "services" });
Service.belongsTo(ServiceCategory, {
  foreignKey: "categoryId",
  as: "category",
});

// --- Mechanic <-> MechanicService <-> Service ---
Mechanic.hasMany(MechanicService, {
  foreignKey: "mechanicId",
  as: "mechanicServices",
});
MechanicService.belongsTo(Mechanic, {
  foreignKey: "mechanicId",
  as: "mechanic",
});
Service.hasMany(MechanicService, {
  foreignKey: "serviceId",
  as: "mechanicServices",
});
MechanicService.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

// --- Workshop <-> WorkshopService <-> Service ---
Workshop.hasMany(WorkshopService, {
  foreignKey: "workshopId",
  as: "workshopServices",
});
WorkshopService.belongsTo(Workshop, {
  foreignKey: "workshopId",
  as: "workshop",
});
Service.hasMany(WorkshopService, {
  foreignKey: "serviceId",
  as: "workshopServices",
});
WorkshopService.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

// --- User <-> Booking ---
User.hasMany(Booking, { foreignKey: "userId", as: "bookings" });
Booking.belongsTo(User, { foreignKey: "userId", as: "user" });

// --- Mechanic <-> Booking ---
Mechanic.hasMany(Booking, { foreignKey: "mechanicId", as: "bookings" });
Booking.belongsTo(Mechanic, { foreignKey: "mechanicId", as: "mechanic" });

// --- Workshop <-> Booking ---
Workshop.hasMany(Booking, { foreignKey: "workshopId", as: "bookings" });
Booking.belongsTo(Workshop, { foreignKey: "workshopId", as: "workshop" });

// --- Service <-> Booking ---
Service.hasMany(Booking, { foreignKey: "serviceId", as: "bookings" });
Booking.belongsTo(Service, { foreignKey: "serviceId", as: "service" });

// --- Booking <-> BookingStatusHistory ---
Booking.hasMany(BookingStatusHistory, {
  foreignKey: "bookingId",
  as: "statusHistory",
});
BookingStatusHistory.belongsTo(Booking, {
  foreignKey: "bookingId",
  as: "booking",
});

// --- Booking <-> BookingOffer ---
Booking.hasMany(BookingOffer, { foreignKey: "bookingId", as: "offers" });
BookingOffer.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

// --- Mechanic <-> BookingOffer ---
Mechanic.hasMany(BookingOffer, { foreignKey: "mechanicId", as: "offers" });
BookingOffer.belongsTo(Mechanic, { foreignKey: "mechanicId", as: "mechanic" });

// --- Booking <-> Transaction ---
Booking.hasOne(Transaction, { foreignKey: "bookingId", as: "transaction" });
Transaction.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

// --- Mechanic <-> MechanicWallet ---
Mechanic.hasOne(MechanicWallet, { foreignKey: "mechanicId", as: "wallet" });
MechanicWallet.belongsTo(Mechanic, {
  foreignKey: "mechanicId",
  as: "mechanic",
});

// --- MechanicWallet <-> MechanicWalletTransaction ---
MechanicWallet.hasMany(MechanicWalletTransaction, {
  foreignKey: "walletId",
  as: "transactions",
});
MechanicWalletTransaction.belongsTo(MechanicWallet, {
  foreignKey: "walletId",
  as: "wallet",
});

// --- MechanicWallet <-> Withdrawal ---
MechanicWallet.hasMany(Withdrawal, {
  foreignKey: "walletId",
  as: "withdrawals",
});
Withdrawal.belongsTo(MechanicWallet, { foreignKey: "walletId", as: "wallet" });

// --- Booking <-> Review ---
Booking.hasOne(Review, { foreignKey: "bookingId", as: "review" });
Review.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });
User.hasMany(Review, { foreignKey: "userId", as: "reviews" });
Review.belongsTo(User, { foreignKey: "userId", as: "user" });
Mechanic.hasMany(Review, { foreignKey: "mechanicId", as: "reviews" });
Review.belongsTo(Mechanic, { foreignKey: "mechanicId", as: "mechanic" });
Workshop.hasMany(Review, { foreignKey: "workshopId", as: "reviews" });
Review.belongsTo(Workshop, { foreignKey: "workshopId", as: "workshop" });

// --- User <-> Notification ---
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// --- Booking <-> Chat ---
Booking.hasOne(Chat, { foreignKey: "bookingId", as: "chat" });
Chat.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

// --- Chat <-> ChatMessage ---
Chat.hasMany(ChatMessage, { foreignKey: "chatId", as: "messages" });
ChatMessage.belongsTo(Chat, { foreignKey: "chatId", as: "chat" });
User.hasMany(ChatMessage, { foreignKey: "senderId", as: "sentMessages" });
ChatMessage.belongsTo(User, { foreignKey: "senderId", as: "sender" });

// --- Mechanic <-> LocationLog ---
Mechanic.hasMany(LocationLog, { foreignKey: "mechanicId", as: "locationLogs" });
LocationLog.belongsTo(Mechanic, { foreignKey: "mechanicId", as: "mechanic" });
Booking.hasMany(LocationLog, { foreignKey: "bookingId", as: "locationLogs" });
LocationLog.belongsTo(Booking, { foreignKey: "bookingId", as: "booking" });

// --- Mechanic <-> MechanicVerification ---
Mechanic.hasOne(MechanicVerification, {
  foreignKey: "mechanicId",
  as: "verification",
});
MechanicVerification.belongsTo(Mechanic, {
  foreignKey: "mechanicId",
  as: "mechanic",
});

// --- BookingStatusHistory.changedBy -> User ---
User.hasMany(BookingStatusHistory, {
  foreignKey: "changedBy",
  as: "statusChanges",
});
BookingStatusHistory.belongsTo(User, {
  foreignKey: "changedBy",
  as: "changedByUser",
});

// --- Withdrawal.processedBy -> User ---
User.hasMany(Withdrawal, {
  foreignKey: "processedBy",
  as: "processedWithdrawals",
});
Withdrawal.belongsTo(User, {
  foreignKey: "processedBy",
  as: "processedByUser",
});

// --- MechanicVerification.reviewedBy -> User ---
User.hasMany(MechanicVerification, {
  foreignKey: "reviewedBy",
  as: "reviewedVerifications",
});
MechanicVerification.belongsTo(User, {
  foreignKey: "reviewedBy",
  as: "reviewedByUser",
});

module.exports = {
  sequelize,
  User,
  Mechanic,
  Workshop,
  ServiceCategory,
  Service,
  MechanicService,
  WorkshopService,
  Booking,
  BookingStatusHistory,
  BookingOffer,
  Transaction,
  MechanicWallet,
  MechanicWalletTransaction,
  Withdrawal,
  Review,
  Notification,
  Chat,
  ChatMessage,
  LocationLog,
  MechanicVerification,
};
