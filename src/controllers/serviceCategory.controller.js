const { ServiceCategory, Service } = require("../models");
const ApiError = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");

/**
 * GET /api/v1/service-categories
 */
exports.getAll = async (req, res, next) => {
  try {
    const categories = await ServiceCategory.findAll({
      where: { isActive: true },
      include: [
        {
          model: Service,
          as: "services",
          where: { isActive: true },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    return success(res, categories);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/service-categories/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByPk(req.params.id, {
      include: [{ model: Service, as: "services" }],
    });

    if (!category) {
      throw ApiError.notFound("Service category not found");
    }

    return success(res, category);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/service-categories
 */
exports.create = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    const category = await ServiceCategory.create({ name, description, icon });
    return created(res, category, "Category created");
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/service-categories/:id
 */
exports.update = async (req, res, next) => {
  try {
    const category = await ServiceCategory.findByPk(req.params.id);
    if (!category) {
      throw ApiError.notFound("Service category not found");
    }

    const { name, description, icon, isActive } = req.body;
    if (name !== undefined) category.name = name;
    if (description !== undefined) category.description = description;
    if (icon !== undefined) category.icon = icon;
    if (isActive !== undefined) category.isActive = isActive;

    await category.save();
    return success(res, category, "Category updated");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/services
 */
exports.getAllServices = async (req, res, next) => {
  try {
    const { categoryId } = req.query;
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;

    const services = await Service.findAll({
      where,
      include: [{ model: ServiceCategory, as: "category" }],
      order: [["name", "ASC"]],
    });

    return success(res, services);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/services
 */
exports.createService = async (req, res, next) => {
  try {
    const { categoryId, name, description, estimatedDuration, basePrice } =
      req.body;

    const category = await ServiceCategory.findByPk(categoryId);
    if (!category) {
      throw ApiError.notFound("Service category not found");
    }

    const service = await Service.create({
      categoryId,
      name,
      description,
      estimatedDuration,
      basePrice,
    });
    return created(res, service, "Service created");
  } catch (error) {
    next(error);
  }
};
