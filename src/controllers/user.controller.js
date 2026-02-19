const { User, Mechanic, Workshop } = require("../models");
const ApiError = require("../utils/apiError");
const { success } = require("../utils/apiResponse");

/**
 * GET /api/v1/users/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [
        { model: Mechanic, as: "mechanic" },
        { model: Workshop, as: "workshop" },
      ],
    });

    if (!user) {
      throw ApiError.notFound("User not found");
    }

    return success(res, user);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone, avatarUrl } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    await user.save();

    return success(res, user, "Profile updated successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/users/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      throw ApiError.notFound("User not found");
    }

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) {
      throw ApiError.badRequest("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    return success(res, null, "Password changed successfully");
  } catch (error) {
    next(error);
  }
};
