const { Op } = require("sequelize");
const {
  Booking,
  Mechanic,
  User,
  MechanicService,
  BookingOffer,
  BookingStatusHistory,
} = require("../models");
const ApiError = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");
const { haversineDistance } = require("../utils/geo");

/**
 * GET /api/v1/matchmaking/:bookingId
 * Find suitable mechanics for a booking
 */
exports.findMechanics = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { radius = 10, limit = 10 } = req.query; // Default radius 10km, limit 10 mechanics

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    // 1. Find mechanics who offer the requested service
    const mechanicsWithService = await MechanicService.findAll({
      where: {
        serviceId: booking.serviceId,
        isActive: true,
      },
      attributes: ["mechanicId", "price"],
    });

    if (mechanicsWithService.length === 0) {
      return success(res, [], "No mechanics found for this service");
    }

    const mechanicIds = mechanicsWithService.map((ms) => ms.mechanicId);

    // 2. Filter mechanics who are online, verified, and within radius
    const mechanics = await Mechanic.findAll({
      where: {
        id: { [Op.in]: mechanicIds },
        status: "online",
        isVerified: true,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "avatarUrl", "phone"],
        },
      ],
    });

    const suitableMechanics = mechanics
      .map((mechanic) => {
        const distance = haversineDistance(
          parseFloat(booking.latitude),
          parseFloat(booking.longitude),
          parseFloat(mechanic.latitude),
          parseFloat(mechanic.longitude),
        );

        const serviceInfo = mechanicsWithService.find(
          (ms) => ms.mechanicId === mechanic.id,
        );

        return {
          ...mechanic.toJSON(),
          distance: parseFloat(distance.toFixed(2)),
          offeredPrice: serviceInfo ? serviceInfo.price : null,
        };
      })
      .filter((m) => m.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit, 10));

    return success(res, suitableMechanics, "Suitable mechanics found");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/matchmaking/:bookingId/notify
 * Send offers to the top suitable mechanics
 */
exports.notifyMechanics = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { radius = 5, limit = 5, message } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.status !== "pending" && booking.status !== "searching") {
      throw ApiError.badRequest("Booking is not in searchable status");
    }

    // Reuse findMechanics logic (could refactor to a service)
    const mechanicsWithService = await MechanicService.findAll({
      where: {
        serviceId: booking.serviceId,
        isActive: true,
      },
      attributes: ["mechanicId", "price"],
    });

    if (mechanicsWithService.length === 0) {
      throw ApiError.notFound("No mechanics found for this service");
    }

    const mechanicIds = mechanicsWithService.map((ms) => ms.mechanicId);

    const mechanics = await Mechanic.findAll({
      where: {
        id: { [Op.in]: mechanicIds },
        status: "online",
        isVerified: true,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
    });

    const suitableMechanics = mechanics
      .map((mechanic) => {
        const distance = haversineDistance(
          parseFloat(booking.latitude),
          parseFloat(booking.longitude),
          parseFloat(mechanic.latitude),
          parseFloat(mechanic.longitude),
        );

        const serviceInfo = mechanicsWithService.find(
          (ms) => ms.mechanicId === mechanic.id,
        );

        return {
          id: mechanic.id,
          distance: distance,
          price: serviceInfo ? serviceInfo.price : booking.estimatedPrice,
        };
      })
      .filter((m) => m.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit, 10));

    if (suitableMechanics.length === 0) {
      throw ApiError.notFound("No suitable mechanics found nearby");
    }

    const offers = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 min expiry

    for (const m of suitableMechanics) {
      // Check if offer already exists to avoid duplicates
      const existingOffer = await BookingOffer.findOne({
        where: {
          bookingId: booking.id,
          mechanicId: m.id,
          status: "pending",
        },
      });

      if (!existingOffer) {
        const offer = await BookingOffer.create({
          bookingId: booking.id,
          mechanicId: m.id,
          price: m.price,
          message: message || "Automated matchmaking offer",
          expiresAt,
        });
        offers.push(offer);
      }
    }

    // Update booking status
    booking.status = "searching";
    await booking.save();

    await BookingStatusHistory.create({
      bookingId: booking.id,
      status: "searching",
      note: `Notified ${offers.length} nearby mechanics`,
      changedBy: req.user.id,
    });

    return created(
      res,
      { notifiedCount: offers.length },
      "Mechanics notified successfully",
    );
  } catch (error) {
    next(error);
  }
};
