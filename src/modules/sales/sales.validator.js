const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createSaleSchema,
  salesFilterSchema,
  saleIdParamSchema,
} = require('./sales.schemas');

const validateCreateSale = validateMiddleware(createSaleSchema, 'body');
const validateSalesFilters = validateMiddleware(salesFilterSchema, 'query');
const validateSaleIdParam = validateMiddleware(saleIdParamSchema, 'params');

module.exports = {
  validateCreateSale,
  validateSalesFilters,
  validateSaleIdParam,
};