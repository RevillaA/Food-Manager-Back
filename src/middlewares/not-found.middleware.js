const NotFoundError = require('../common/errors/not-found-error');

const notFoundMiddleware = (req, res, next) => {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundMiddleware;