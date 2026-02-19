const { Op } = require("sequelize");
const {
  User,
  Mechanic,
  Workshop,
  Booking,
  Transaction,
  Withdrawal,
  MechanicVerification,
  MechanicWallet,
  MechanicWalletTransaction,
} = require("../models");
const sequelize = require("../config/database");
const ApiError = require("../utils/apiError");
const { success, paginated } = require("../utils/apiResponse");

/**
 * GET /api/v1/admin/dashboard
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMechanics,
      totalWorkshops,
      totalBookings,
      activeBookings,
      completedBookings,
      pendingVerifications,
      pendingWithdrawals,
    ] = await Promise.all([
      User.count(),
      Mechanic.count(),
      Workshop.count(),
      Booking.count(),
      Booking.count({
        where: {
          status: {
            [Op.in]: [
              "pending",
              "searching",
              "offered",
              "accepted",
              "in_progress",
            ],
          },
        },
      }),
      Booking.count({ where: { status: "completed" } }),
      MechanicVerification.count({ where: { status: "pending" } }),
      Withdrawal.count({ where: { status: "pending" } }),
    ]);

    // Total revenue
    const revenueResult = await Transaction.findOne({
      attributes: [
        [
          sequelize.fn(
            "COALESCE",
            sequelize.fn("SUM", sequelize.col("platform_fee")),
            0,
          ),
          "totalRevenue",
        ],
      ],
      where: { status: "released" },
    });

    return success(res, {
      totalUsers,
      totalMechanics,
      totalWorkshops,
      totalBookings,
      activeBookings,
      completedBookings,
      pendingVerifications,
      pendingWithdrawals,
      totalRevenue: revenueResult
        ? revenueResult.getDataValue("totalRevenue")
        : 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search } = req.query;
    const where = {};

    if (role) where.role = role;
    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await User.findAndCountAll({
      where,
      attributes: { exclude: ["password"] },
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
 * GET /api/v1/admin/bookings
 */
exports.getBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};
    if (status) where.status = status;

    const result = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: "user", attributes: ["id", "fullName", "email"] },
        {
          model: Mechanic,
          as: "mechanic",
          include: [
            { model: User, as: "user", attributes: ["id", "fullName"] },
          ],
        },
        { model: Workshop, as: "workshop", attributes: ["id", "name"] },
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
 * GET /api/v1/admin/withdrawals
 */
exports.getWithdrawals = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const where = {};
    if (status) where.status = status;

    const result = await Withdrawal.findAndCountAll({
      where,
      include: [
        {
          model: MechanicWallet,
          as: "wallet",
          include: [
            {
              model: Mechanic,
              as: "mechanic",
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "fullName", "phone"],
                },
              ],
            },
          ],
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
 * PATCH /api/v1/admin/withdrawals/:id — Approve/reject withdrawal
 */
exports.processWithdrawal = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { status, rejectionReason } = req.body;

    if (!["completed", "rejected"].includes(status)) {
      await t.rollback();
      throw ApiError.badRequest("Status must be completed or rejected");
    }

    const withdrawal = await Withdrawal.findByPk(req.params.id, {
      transaction: t,
    });
    if (!withdrawal) {
      await t.rollback();
      throw ApiError.notFound("Withdrawal not found");
    }

    if (withdrawal.status !== "pending") {
      await t.rollback();
      throw ApiError.badRequest("Withdrawal is not in pending status");
    }

    withdrawal.status = status === "completed" ? "processing" : status;
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = req.user.id;

    if (status === "rejected") {
      withdrawal.rejectionReason = rejectionReason;
    }

    if (status === "completed") {
      // Debit wallet
      const wallet = await MechanicWallet.findByPk(withdrawal.walletId, {
        transaction: t,
      });
      if (!wallet) {
        await t.rollback();
        throw ApiError.notFound("Wallet not found");
      }

      const amount = parseFloat(withdrawal.amount);
      if (parseFloat(wallet.balance) < amount) {
        await t.rollback();
        throw ApiError.badRequest("Insufficient wallet balance");
      }

      wallet.balance = parseFloat(wallet.balance) - amount;
      wallet.totalWithdrawn = parseFloat(wallet.totalWithdrawn) + amount;
      await wallet.save({ transaction: t });

      await MechanicWalletTransaction.create(
        {
          walletId: wallet.id,
          type: "debit",
          amount,
          balanceAfter: wallet.balance,
          description: `Withdrawal #${withdrawal.id.substring(0, 8)}`,
          referenceType: "withdrawal",
          referenceId: withdrawal.id,
        },
        { transaction: t },
      );

      withdrawal.status = "completed";
    }

    await withdrawal.save({ transaction: t });
    await t.commit();

    return success(res, withdrawal, `Withdrawal ${status}`);
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    next(error);
  }
};
