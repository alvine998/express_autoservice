const { Op } = require("sequelize");
const {
  Booking,
  BookingStatusHistory,
  BookingOffer,
  User,
  Mechanic,
  Workshop,
  Service,
  ServiceCategory,
  Transaction,
} = require("../models");
const ApiError = require("../utils/apiError");
const { success, created, paginated } = require("../utils/apiResponse");

/**
 * POST /api/v1/bookings
 */
exports.create = async (req, res, next) => {
  try {
    const {
      serviceId,
      bookingType,
      scheduledAt,
      address,
      latitude,
      longitude,
      problemDescription,
      workshopId,
    } = req.body;

    // Validate service exists
    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw ApiError.notFound("Service not found");
    }

    const booking = await Booking.create({
      userId: req.user.id,
      serviceId,
      bookingType: bookingType || "instant",
      scheduledAt: bookingType === "scheduled" ? scheduledAt : null,
      status: "pending",
      address,
      latitude,
      longitude,
      problemDescription,
      workshopId: workshopId || null,
      estimatedPrice: service.basePrice,
    });

    // Create initial status history
    await BookingStatusHistory.create({
      bookingId: booking.id,
      status: "pending",
      note: "Booking created",
      changedBy: req.user.id,
    });

    return created(res, booking, "Booking created successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/bookings
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};

    // Filter by role
    if (req.user.role === "user") {
      where.userId = req.user.id;
    } else if (req.user.role === "mechanic") {
      const mechanic = await Mechanic.findOne({
        where: { userId: req.user.id },
      });
      if (mechanic) where.mechanicId = mechanic.id;
    } else if (req.user.role === "workshop_owner") {
      const workshop = await Workshop.findOne({
        where: { userId: req.user.id },
      });
      if (workshop) where.workshopId = workshop.id;
    }

    if (status) where.status = status;

    const result = await Booking.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "phone", "avatarUrl"],
        },
        {
          model: Mechanic,
          as: "mechanic",
          include: [
            { model: User, as: "user", attributes: ["id", "fullName"] },
          ],
        },
        { model: Workshop, as: "workshop", attributes: ["id", "name"] },
        {
          model: Service,
          as: "service",
          include: [{ model: ServiceCategory, as: "category" }],
        },
      ],
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
 * GET /api/v1/bookings/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "phone", "avatarUrl"],
        },
        {
          model: Mechanic,
          as: "mechanic",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "fullName", "phone", "avatarUrl"],
            },
          ],
        },
        { model: Workshop, as: "workshop" },
        {
          model: Service,
          as: "service",
          include: [{ model: ServiceCategory, as: "category" }],
        },
        {
          model: BookingStatusHistory,
          as: "statusHistory",
          order: [["createdAt", "ASC"]],
        },
        {
          model: BookingOffer,
          as: "offers",
          include: [
            {
              model: Mechanic,
              as: "mechanic",
              include: [
                { model: User, as: "user", attributes: ["id", "fullName"] },
              ],
            },
          ],
        },
        { model: Transaction, as: "transaction" },
      ],
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    return success(res, booking);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/bookings/:id/offers — Send offer to mechanic(s)
 */
exports.createOffer = async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    const { mechanicId, price, estimatedDuration, message } = req.body;

    const mechanic = await Mechanic.findByPk(mechanicId);
    if (!mechanic) {
      throw ApiError.notFound("Mechanic not found");
    }

    const offer = await BookingOffer.create({
      bookingId: booking.id,
      mechanicId,
      price,
      estimatedDuration,
      message,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min expiry
    });

    // Update booking status
    if (booking.status === "pending") {
      booking.status = "offered";
      await booking.save();
      await BookingStatusHistory.create({
        bookingId: booking.id,
        status: "offered",
        note: "Offer sent to mechanic",
        changedBy: req.user.id,
      });
    }

    return created(res, offer, "Offer sent to mechanic");
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/bookings/offers/:offerId — Accept/reject offer
 */
exports.respondToOffer = async (req, res, next) => {
  try {
    const { status } = req.body; // 'accepted' or 'rejected'

    if (!["accepted", "rejected"].includes(status)) {
      throw ApiError.badRequest("Status must be accepted or rejected");
    }

    const offer = await BookingOffer.findByPk(req.params.offerId, {
      include: [{ model: Booking, as: "booking" }],
    });

    if (!offer) {
      throw ApiError.notFound("Offer not found");
    }

    offer.status = status;
    offer.respondedAt = new Date();
    await offer.save();

    if (status === "accepted") {
      const booking = offer.booking;
      booking.mechanicId = offer.mechanicId;
      booking.status = "accepted";
      booking.estimatedPrice = offer.price;
      await booking.save();

      // Reject other pending offers
      await BookingOffer.update(
        { status: "rejected", respondedAt: new Date() },
        {
          where: {
            bookingId: booking.id,
            id: { [Op.ne]: offer.id },
            status: "pending",
          },
        },
      );

      // Update mechanic status to busy
      await Mechanic.update(
        { status: "busy" },
        { where: { id: offer.mechanicId } },
      );

      await BookingStatusHistory.create({
        bookingId: booking.id,
        status: "accepted",
        note: `Offer accepted — mechanic assigned`,
        changedBy: req.user.id,
      });
    }

    return success(res, offer, `Offer ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status, note, cancellationReason } = req.body;

    const validStatuses = [
      "searching",
      "in_progress",
      "completed",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(
        `Status must be one of: ${validStatuses.join(", ")}`,
      );
    }

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    booking.status = status;

    if (status === "completed") {
      booking.completedAt = new Date();
      // Set mechanic back to online
      if (booking.mechanicId) {
        await Mechanic.update(
          { status: "online" },
          { where: { id: booking.mechanicId } },
        );
      }
    }

    if (status === "cancelled") {
      booking.cancelledAt = new Date();
      booking.cancellationReason = cancellationReason || null;
      if (booking.mechanicId) {
        await Mechanic.update(
          { status: "online" },
          { where: { id: booking.mechanicId } },
        );
      }
    }

    await booking.save();

    await BookingStatusHistory.create({
      bookingId: booking.id,
      status,
      note: note || `Status updated to ${status}`,
      changedBy: req.user.id,
    });

    return success(res, booking, `Booking status updated to ${status}`);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/bookings/:id/price
 */
exports.setFinalPrice = async (req, res, next) => {
  try {
    const { finalPrice } = req.body;

    const booking = await Booking.findByPk(req.params.id);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    booking.finalPrice = finalPrice;
    await booking.save();

    return success(res, booking, "Final price set");
  } catch (error) {
    next(error);
  }
};
