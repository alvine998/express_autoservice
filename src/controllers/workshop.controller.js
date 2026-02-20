const { Op } = require("sequelize");
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
const { haversineDistance } = require("../utils/geo");

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
 * GET /api/v1/workshops/nearby
 * Find nearby workshops, optionally filtered by service keyword (e.g. "Tambal Ban")
 */
exports.findNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10, service, limit = 20 } = req.query;

    if (!latitude || !longitude) {
      throw ApiError.badRequest("Latitude and longitude are required");
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    // Build service filter
    const serviceWhere = { isActive: true };
    if (service) {
      serviceWhere["$service.name$"] = { [Op.like]: `%${service}%` };
    }

    const workshops = await Workshop.findAll({
      where: {
        isActive: true,
        status: "online",
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "avatarUrl"],
        },
        {
          model: WorkshopService,
          as: "workshopServices",
          where: service ? { isActive: true } : undefined,
          required: !!service,
          include: [
            {
              model: Service,
              as: "service",
              where: service
                ? { name: { [Op.like]: `%${service}%` } }
                : undefined,
              required: !!service,
              include: [{ model: ServiceCategory, as: "category" }],
            },
          ],
        },
      ],
    });

    const nearby = workshops
      .map((w) => {
        const wLat = parseFloat(w.latitude);
        const wLng = parseFloat(w.longitude);
        if (!wLat || !wLng) return null;
        const distance = haversineDistance(lat, lng, wLat, wLng);
        return {
          ...w.toJSON(),
          distance: Math.round(distance * 100) / 100,
        };
      })
      .filter((w) => w && w.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, parseInt(limit, 10));

    return success(res, nearby, `Found ${nearby.length} nearby workshops`);
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

/**
 * PATCH /api/v1/workshops/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["online", "offline"].includes(status)) {
      throw ApiError.badRequest("Status must be online or offline");
    }

    const workshop = await Workshop.findOne({ where: { userId: req.user.id } });
    if (!workshop) {
      throw ApiError.notFound("Workshop profile not found");
    }

    workshop.status = status;
    await workshop.save();

    return success(res, { status: workshop.status }, "Workshop status updated");
  } catch (error) {
    next(error);
  }
};
