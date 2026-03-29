const validateMiddleware = require('../../middlewares/validate.middleware');
const { loginSchema } = require('./auth.schemas');

const validateLogin = validateMiddleware(loginSchema, 'body');

module.exports = {
  validateLogin,
};