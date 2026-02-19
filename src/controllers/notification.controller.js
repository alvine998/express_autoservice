const { Notification } = require("../models");
const ApiError = require("../utils/apiError");
const { success, paginated } = require("../utils/apiResponse");

/**
 * GET /api/v1/notifications
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, isRead } = req.query;
    const where = { userId: req.user.id };

    if (type) where.type = type;
    if (isRead !== undefined) where.isRead = isRead === "true";

    const result = await Notification.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [["createdAt", "DESC"]],
    });

    return paginated(res, { ...result, page, limit });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/notifications/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    return success(res, { unreadCount: count });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!notification) throw ApiError.notFound("Notification not found");

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return success(res, notification, "Marked as read");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId: req.user.id, isRead: false } },
    );

    return success(res, null, "All notifications marked as read");
  } catch (error) {
    next(error);
  }
};
