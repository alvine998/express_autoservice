const { Review, Booking, User, Mechanic, Workshop } = require("../models");
const ApiError = require("../utils/apiError");
const { success, created, paginated } = require("../utils/apiResponse");

/**
 * POST /api/v1/reviews
 */
exports.create = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;

    const booking = await Booking.findByPk(bookingId);
    if (!booking) throw ApiError.notFound("Booking not found");
    if (booking.status !== "completed")
      throw ApiError.badRequest("Can only review completed bookings");
    if (booking.userId !== req.user.id)
      throw ApiError.forbidden("You can only review your own bookings");

    const existing = await Review.findOne({ where: { bookingId } });
    if (existing)
      throw ApiError.conflict("Review already exists for this booking");

    const review = await Review.create({
      bookingId,
      userId: req.user.id,
      mechanicId: booking.mechanicId || null,
      workshopId: booking.workshopId || null,
      rating,
      comment,
    });

    // Update mechanic/workshop rating
    if (booking.mechanicId) {
      const mechanic = await Mechanic.findByPk(booking.mechanicId);
      if (mechanic) {
        const reviews = await Review.findAll({
          where: { mechanicId: mechanic.id },
        });
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        mechanic.rating = Math.round(avgRating * 100) / 100;
        mechanic.totalReviews = reviews.length;
        await mechanic.save();
      }
    }

    if (booking.workshopId) {
      const workshop = await Workshop.findByPk(booking.workshopId);
      if (workshop) {
        const reviews = await Review.findAll({
          where: { workshopId: workshop.id },
        });
        const avgRating =
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        workshop.rating = Math.round(avgRating * 100) / 100;
        workshop.totalReviews = reviews.length;
        await workshop.save();
      }
    }

    return created(res, review, "Review submitted");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/reviews/mechanic/:id
 */
exports.getMechanicReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await Review.findAndCountAll({
      where: { mechanicId: req.params.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "avatarUrl"],
        },
        { model: Booking, as: "booking", attributes: ["id", "serviceId"] },
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
 * GET /api/v1/reviews/workshop/:id
 */
exports.getWorkshopReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await Review.findAndCountAll({
      where: { workshopId: req.params.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "avatarUrl"],
        },
        { model: Booking, as: "booking", attributes: ["id", "serviceId"] },
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
