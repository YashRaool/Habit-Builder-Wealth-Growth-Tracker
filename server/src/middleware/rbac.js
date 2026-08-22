const { sendForbidden } = require('../utils/response');

/**
 * Role-based access control middleware.
 * Usage: authorize('admin') or authorize('admin', 'user')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendForbidden(res, `Role '${req.user?.role}' is not authorized to access this resource.`);
    }
    next();
  };
};

module.exports = { authorize };
