const { Op } = require("sequelize");
const {
  Mechanic,
  User,
  MechanicService,
  Service,
  MechanicWallet,
  MechanicWalletTransaction,
  Withdrawal,
  Review,
  ServiceCategory,
} = require("../models");
const ApiError = require("../utils/apiError");
const { success, paginated } = require("../utils/apiResponse");
const { haversineDistance } = require("../utils/geo");

/**
 * GET /api/v1/mechanics
 */
exports.getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, isVerified } = req.query;
    const where = {};

    if (status) where.status = status;
    if (isVerified !== undefined) where.isVerified = isVerified === "true";

    const result = await Mechanic.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
        },
        {
          model: MechanicService,
          as: "mechanicServices",
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
 * GET /api/v1/mechanics/nearby
 */
exports.getNearby = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      throw ApiError.badRequest("Latitude and longitude are required");
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = parseFloat(radius);

    const mechanics = await Mechanic.findAll({
      where: { status: "online", isVerified: true },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "phone", "avatarUrl"],
        },
        {
          model: MechanicService,
          as: "mechanicServices",
          include: [{ model: Service, as: "service" }],
        },
      ],
    });

    // Calculate distance & filter
    const nearby = mechanics
      .map((m) => {
        const mechLat = parseFloat(m.latitude);
        const mechLng = parseFloat(m.longitude);
        if (!mechLat || !mechLng) return null;
        const distance = haversineDistance(lat, lng, mechLat, mechLng);
        return { ...m.toJSON(), distance: Math.round(distance * 100) / 100 };
      })
      .filter((m) => m && m.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance);

    return success(res, nearby);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/mechanics/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone", "avatarUrl"],
        },
        {
          model: MechanicService,
          as: "mechanicServices",
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

    if (!mechanic) {
      throw ApiError.notFound("Mechanic not found");
    }

    return success(res, mechanic);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/mechanics/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const {
      bio,
      experienceYears,
      latitude,
      longitude,
      ktpNumber,
      bankName,
      bankAccountNumber,
      bankAccountName,
    } = req.body;

    if (bio !== undefined) mechanic.bio = bio;
    if (experienceYears !== undefined)
      mechanic.experienceYears = experienceYears;
    if (latitude !== undefined) mechanic.latitude = latitude;
    if (longitude !== undefined) mechanic.longitude = longitude;
    if (ktpNumber !== undefined) mechanic.ktpNumber = ktpNumber;
    if (bankName !== undefined) mechanic.bankName = bankName;
    if (bankAccountNumber !== undefined)
      mechanic.bankAccountNumber = bankAccountNumber;
    if (bankAccountName !== undefined)
      mechanic.bankAccountName = bankAccountName;

    await mechanic.save();

    return success(res, mechanic, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/mechanics/status
 */
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["online", "offline"].includes(status)) {
      throw ApiError.badRequest("Status must be online or offline");
    }

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    mechanic.status = status;
    await mechanic.save();

    return success(res, { status: mechanic.status }, "Status updated");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/mechanics/services
 */
exports.addService = async (req, res, next) => {
  try {
    const { serviceId, price } = req.body;

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const service = await Service.findByPk(serviceId);
    if (!service) {
      throw ApiError.notFound("Service not found");
    }

    const existing = await MechanicService.findOne({
      where: { mechanicId: mechanic.id, serviceId },
    });
    if (existing) {
      throw ApiError.conflict("Service already added");
    }

    const mechanicService = await MechanicService.create({
      mechanicId: mechanic.id,
      serviceId,
      price,
    });

    return success(res, mechanicService, "Service added");
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/mechanics/services/:serviceId
 */
exports.removeService = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const mechanicService = await MechanicService.findOne({
      where: { mechanicId: mechanic.id, serviceId: req.params.serviceId },
    });

    if (!mechanicService) {
      throw ApiError.notFound("Mechanic service not found");
    }

    await mechanicService.destroy();

    return success(res, null, "Service removed");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/mechanics/wallet
 */
exports.getWallet = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const wallet = await MechanicWallet.findOne({
      where: { mechanicId: mechanic.id },
    });

    return success(res, wallet);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/mechanics/wallet/transactions
 */
exports.getWalletTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const wallet = await MechanicWallet.findOne({
      where: { mechanicId: mechanic.id },
    });
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    const result = await MechanicWalletTransaction.findAndCountAll({
      where: { walletId: wallet.id },
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
 * POST /api/v1/mechanics/wallet/withdraw
 */
exports.requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, bankName, bankAccountNumber, bankAccountName } = req.body;

    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) {
      throw ApiError.notFound("Mechanic profile not found");
    }

    const wallet = await MechanicWallet.findOne({
      where: { mechanicId: mechanic.id },
    });
    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    if (parseFloat(wallet.balance) < parseFloat(amount)) {
      throw ApiError.badRequest("Insufficient wallet balance");
    }

    const withdrawal = await Withdrawal.create({
      walletId: wallet.id,
      amount,
      bankName,
      bankAccountNumber,
      bankAccountName,
    });

    return success(res, withdrawal, "Withdrawal request submitted");
  } catch (error) {
    next(error);
  }
};
