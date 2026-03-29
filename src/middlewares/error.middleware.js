const logger = require('../config/logger');

const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';
  const details = error.details || null;

  logger.error('HTTP request failed', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    statusCode,
    code,
    message,
    stack: error.stack,
  });

  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details,
    },
    requestId: req.requestId,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

module.exports = errorMiddleware;