const { MechanicVerification, Mechanic, User } = require("../models");
const ApiError = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");

/**
 * POST /api/v1/verifications/submit
 */
exports.submit = async (req, res, next) => {
  try {
    const mechanic = await Mechanic.findOne({ where: { userId: req.user.id } });
    if (!mechanic) throw ApiError.notFound("Mechanic profile not found");

    const existing = await MechanicVerification.findOne({
      where: { mechanicId: mechanic.id },
    });
    if (existing && existing.status === "approved") {
      throw ApiError.conflict("Already verified");
    }
    if (existing && existing.status === "pending") {
      throw ApiError.conflict(
        "Verification already submitted and pending review",
      );
    }

    const { ktpNumber } = req.body;

    let ktpImageUrl = "";
    let selfieImageUrl = "";

    if (req.files) {
      if (req.files.ktpImage && req.files.ktpImage[0]) {
        ktpImageUrl = req.files.ktpImage[0].path;
      }
      if (req.files.selfieImage && req.files.selfieImage[0]) {
        selfieImageUrl = req.files.selfieImage[0].path;
      }
    }

    if (!ktpImageUrl || !selfieImageUrl) {
      throw ApiError.badRequest("KTP image and selfie image are required");
    }

    // Delete rejected verification if exists
    if (existing && existing.status === "rejected") {
      await existing.destroy({ force: true });
    }

    const verification = await MechanicVerification.create({
      mechanicId: mechanic.id,
      ktpNumber,
      ktpImageUrl,
      selfieImageUrl,
    });

    return created(res, verification, "Verification submitted for review");
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/verifications/:mechanicId
 */
exports.getByMechanic = async (req, res, next) => {
  try {
    const verification = await MechanicVerification.findOne({
      where: { mechanicId: req.params.mechanicId },
      include: [
        {
          model: Mechanic,
          as: "mechanic",
          include: [
            { model: User, as: "user", attributes: ["id", "fullName"] },
          ],
        },
      ],
    });

    if (!verification) throw ApiError.notFound("Verification not found");

    return success(res, verification);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/verifications/:id/review — Admin approve/reject
 */
exports.review = async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      throw ApiError.badRequest("Status must be approved or rejected");
    }

    const verification = await MechanicVerification.findByPk(req.params.id);
    if (!verification) throw ApiError.notFound("Verification not found");

    verification.status = status;
    verification.reviewedBy = req.user.id;
    verification.reviewedAt = new Date();

    if (status === "rejected") {
      verification.rejectionReason = rejectionReason;
    }

    await verification.save();

    // Update mechanic verified status
    if (status === "approved") {
      await Mechanic.update(
        { isVerified: true },
        { where: { id: verification.mechanicId } },
      );
    }

    return success(res, verification, `Verification ${status}`);
  } catch (error) {
    next(error);
  }
};
