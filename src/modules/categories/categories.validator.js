const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
  categoriesFilterSchema,
  categoryIdParamSchema,
} = require('./categories.schemas');

const validateCreateCategory = validateMiddleware(createCategorySchema, 'body');
const validateUpdateCategory = validateMiddleware(updateCategorySchema, 'body');
const validateUpdateCategoryStatus = validateMiddleware(updateCategoryStatusSchema, 'body');
const validateCategoryFilters = validateMiddleware(categoriesFilterSchema, 'query');
const validateCategoryIdParam = validateMiddleware(categoryIdParamSchema, 'params');

module.exports = {
  validateCreateCategory,
  validateUpdateCategory,
  validateUpdateCategoryStatus,
  validateCategoryFilters,
  validateCategoryIdParam,
};