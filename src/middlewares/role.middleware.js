const ApiError = require("../utils/apiError");

/**
 * Role-based access control middleware
 * Usage: authorize('admin', 'mechanic')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden("You do not have permission to perform this action"),
      );
    }
    next();
  };
};

module.exports = authorize;
