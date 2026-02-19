const { LocationLog, Mechanic, Booking } = require("../models");
const ApiError = require("../utils/apiError");
const { success, paginated } = require("../utils/apiResponse");

/**
 * POST /api/v1/locations/track
 */
exports.track = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy, bookingId } = req.body;

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) throw ApiError.notFound("Mechanic profile not found");

    // Update mechanic's current location
    mechanic.latitude = latitude;
    mechanic.longitude = longitude;
    await mechanic.save();

    // Log location
    const log = await LocationLog.create({
      mechanicId: mechanic.id,
      bookingId: bookingId || null,
      latitude,
      longitude,
      accuracy,
    });

    return success(res, log, "Location tracked");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/locations/booking/:bookingId
 */
exports.getBookingLocations = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.query;

    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");

    const result = await LocationLog.findAndCountAll({
      where: { bookingId: booking.id },
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
 * GET /api/v1/locations/mechanic/:mechanicId/latest
 */
exports.getMechanicLatestLocation = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findByPk(req.params.mechanicId);
    if (!mechanic) throw ApiError.notFound("Mechanic not found");

    return success(res, {
      latitude: mechanic.latitude,
      longitude: mechanic.longitude,
      lastUpdated: mechanic.updatedAt,
    });
  } catch (error) {
    next(error);
  }
};
