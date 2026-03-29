const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  productsFilterSchema,
  productIdParamSchema,
} = require('./products.schemas');

const validateCreateProduct = validateMiddleware(createProductSchema, 'body');
const validateUpdateProduct = validateMiddleware(updateProductSchema, 'body');
const validateUpdateProductStatus = validateMiddleware(updateProductStatusSchema, 'body');
const validateProductsFilters = validateMiddleware(productsFilterSchema, 'query');
const validateProductIdParam = validateMiddleware(productIdParamSchema, 'params');

module.exports = {
  validateCreateProduct,
  validateUpdateProduct,
  validateUpdateProductStatus,
  validateProductsFilters,
  validateProductIdParam,
};