const jwt = require("jsonwebtoken");
const { User, Mechanic, Workshop, MechanicWallet } = require("../models");
const ApiError = require("../utils/apiError");
const { success, created } = require("../utils/apiResponse");

/**
 * Generate JWT access token
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
};

/**
 * Generate JWT refresh token
 */
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  });
};

/**
 * POST /api/v1/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, phone, password, role } = req.body;

    // Check existing user
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw ApiError.conflict("Email is already registered");
    }

    const existingPhone = await User.findOne({ where: { phone } });
    if (existingPhone) {
      throw ApiError.conflict("Phone number is already registered");
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      phone,
      password,
      role: role || "user",
    });

    // Create role-specific profile
    if (user.role === "mechanic") {
      const mechanic = await Mechanic.create({ userId: user.id });
      // Auto-create wallet for mechanic
      await MechanicWallet.create({ mechanicId: mechanic.id });
    } else if (user.role === "workshop_owner") {
      await Workshop.create({
        userId: user.id,
        name: `${fullName}'s Workshop`,
        address: "Please update your address",
      });
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return created(
      res,
      {
        user,
        token,
        refreshToken,
      },
      "Registration successful",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password");
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    return success(
      res,
      {
        user,
        token,
        refreshToken,
      },
      "Login successful",
    );
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/auth/refresh-token
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw ApiError.badRequest("Refresh token is required");
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Invalid refresh token");
    }

    const newToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    return success(
      res,
      {
        token: newToken,
        refreshToken: newRefreshToken,
      },
      "Token refreshed",
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Invalid refresh token"));
    }
    next(error);
  }
};
