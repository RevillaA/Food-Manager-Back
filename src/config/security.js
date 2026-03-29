const helmet = require('helmet');

const securityMiddleware = helmet({
  crossOriginResourcePolicy: false,
});

module.exports = securityMiddleware;