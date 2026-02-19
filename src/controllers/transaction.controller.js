const {
  Transaction,
  Booking,
  MechanicWallet,
  MechanicWalletTransaction,
  Mechanic,
} = require("../models");
const sequelize = require("../config/database");
const ApiError = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");

const PLATFORM_FEE_PERCENT = 10; // 10% platform fee

/**
 * GET /api/v1/transactions/:bookingId
 */
exports.getByBooking = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { bookingId: req.params.bookingId },
      include: [{ model: Booking, as: "booking" }],
    });

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    return success(res, transaction);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/transactions/:bookingId/hold — Hold funds in escrow
 */
exports.holdEscrow = async (req, res, next) => {
  try {
    const { amount, paymentMethod, paymentReference } = req.body;

    const booking = await Booking.findByPk(req.params.bookingId);
    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    // Check no existing transaction
    const existing = await Transaction.findOne({
      where: { bookingId: booking.id },
    });
    if (existing) {
      throw ApiError.conflict("Transaction already exists for this booking");
    }

    const platformFee = (parseFloat(amount) * PLATFORM_FEE_PERCENT) / 100;
    const mechanicEarnings = parseFloat(amount) - platformFee;

    const transaction = await Transaction.create({
      bookingId: booking.id,
      amount,
      platformFee,
      mechanicEarnings,
      status: "held",
      paymentMethod,
      paymentReference,
      escrowHeldAt: new Date(),
    });

    return created(res, transaction, "Funds held in escrow");
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/transactions/:bookingId/release — Release escrow to mechanic
 */
exports.releaseEscrow = async (req, res, next) => {
  const t = await sequelize.transaction();

  try {
    const transaction = await Transaction.findOne({
      where: { bookingId: req.params.bookingId },
      transaction: t,
    });

    if (!transaction) {
      await t.rollback();
      throw ApiError.notFound("Transaction not found");
    }

    if (transaction.status !== "held") {
      await t.rollback();
      throw ApiError.badRequest("Transaction is not in held status");
    }

    const booking = await Booking.findByPk(req.params.bookingId, {
      transaction: t,
    });
    if (!booking || !booking.mechanicId) {
      await t.rollback();
      throw ApiError.badRequest("No mechanic assigned to this booking");
    }

    // Credit mechanic wallet
    const wallet = await MechanicWallet.findOne({
      where: { mechanicId: booking.mechanicId },
      transaction: t,
    });

    if (wallet) {
      const earnings = parseFloat(transaction.mechanicEarnings);
      wallet.balance = parseFloat(wallet.balance) + earnings;
      wallet.totalEarnings = parseFloat(wallet.totalEarnings) + earnings;
      await wallet.save({ transaction: t });

      await MechanicWalletTransaction.create(
        {
          walletId: wallet.id,
          type: "credit",
          amount: earnings,
          balanceAfter: wallet.balance,
          description: `Earnings from booking #${booking.id.substring(0, 8)}`,
          referenceType: "booking",
          referenceId: booking.id,
        },
        { transaction: t },
      );
    }

    // Update transaction status
    transaction.status = "released";
    transaction.escrowReleasedAt = new Date();
    await transaction.save({ transaction: t });

    await t.commit();

    return success(res, transaction, "Escrow released to mechanic");
  } catch (error) {
    if (t && !t.finished) await t.rollback();
    next(error);
  }
};

/**
 * POST /api/v1/transactions/:bookingId/refund
 */
exports.refund = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      where: { bookingId: req.params.bookingId },
    });

    if (!transaction) {
      throw ApiError.notFound("Transaction not found");
    }

    if (transaction.status !== "held") {
      throw ApiError.badRequest("Only held transactions can be refunded");
    }

    transaction.status = "refunded";
    transaction.refundedAt = new Date();
    await transaction.save();

    return success(res, transaction, "Transaction refunded");
  } catch (error) {
    next(error);
  }
};
