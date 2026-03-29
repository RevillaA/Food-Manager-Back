const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
  usersPaginationSchema,
} = require('./users.schemas');

const validateCreateUser = validateMiddleware(createUserSchema, 'body');
const validateUpdateUser = validateMiddleware(updateUserSchema, 'body');
const validateUpdateUserStatus = validateMiddleware(updateUserStatusSchema, 'body');
const validateUserIdParam = validateMiddleware(userIdParamSchema, 'params');
const validateUsersPagination = validateMiddleware(usersPaginationSchema, 'query');

module.exports = {
  validateCreateUser,
  validateUpdateUser,
  validateUpdateUserStatus,
  validateUserIdParam,
  validateUsersPagination,
};