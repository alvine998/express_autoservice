const jwt = require("jsonwebtoken");
const ApiError = require("../utils/apiError");

/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("Access token is required");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
    next(error);
  }
};

module.exports = authenticate;
