const {
  Workshop,
  User,
  WorkshopService,
  Service,
  ServiceCategory,
  Review,
} = require("../models");
const ApiError = require("../utils/apiError");
const { success, paginated } = require("../utils/apiResponse");

/**
 * GET /api/v1/workshops
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isActive } = req.query;
    const where = {};

    if (isActive !== undefined) where.isActive = isActive === "true";

    const result = await Workshop.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "avatarUrl"],
        },
        {
          model: WorkshopService,
          as: "workshopServices",
          include: [
            {
              model: Service,
              as: "service",
              include: [{ model: ServiceCategory, as: "category" }],
            },
          ],
        },
      ],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10),
      order: [["rating", "DESC"]],
    });

    return paginated(res, { ...result, page, limit });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/workshops/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "avatarUrl"],
        },
        {
          model: WorkshopService,
          as: "workshopServices",
          include: [
            {
              model: Service,
              as: "service",
              include: [{ model: ServiceCategory, as: "category" }],
            },
          ],
        },
        {
          model: Review,
          as: "reviews",
          limit: 10,
          order: [["createdAt", "DESC"]],
        },
      ],
    });

    if (!workshop) {
      throw ApiError.notFound("Workshop not found");
    }

    return success(res, workshop);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/workshops/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const workshop = await Workshop.findOne({ where: { userId: req.user.id } });
    if (!workshop) {
      throw ApiError.notFound("Workshop profile not found");
    }

    const allowedFields = [
      "name",
      "description",
      "address",
      "latitude",
      "longitude",
      "phone",
      "operatingHoursStart",
      "operatingHoursEnd",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        workshop[field] = req.body[field];
      }
    });

    await workshop.save();

    return success(res, workshop, "Workshop profile updated");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/workshops/services
 */
exports.addService = async (req, res, next) => {
  try {
    const { serviceId, price } = req.body;

    const workshop = await Workshop.findOne({ where: { userId: req.user.id } });
    if (!workshop) {
      throw ApiError.notFound("Workshop profile not found");
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw ApiError.notFound("Service not found");
    }

    const existing = await WorkshopService.findOne({
      where: { workshopId: workshop.id, serviceId },
    });
    if (existing) {
      throw ApiError.conflict("Service already added");
    }

    const workshopService = await WorkshopService.create({
      workshopId: workshop.id,
      serviceId,
      price,
    });

    return success(res, workshopService, "Service added to workshop");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/workshops/services/:serviceId
 */
exports.removeService = async (req, res, next) => {
  try {
    const workshop = await Workshop.findOne({ where: { userId: req.user.id } });
    if (!workshop) {
      throw ApiError.notFound("Workshop profile not found");
    }

    const workshopService = await WorkshopService.findOne({
      where: { workshopId: workshop.id, serviceId: req.params.serviceId },
    });

    if (!workshopService) {
      throw ApiError.notFound("Workshop service not found");
    }

    await workshopService.destroy();

    return success(res, null, "Service removed from workshop");
  } catch (error) {
    next(error);
  }
};
