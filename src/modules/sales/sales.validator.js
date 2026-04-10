const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createSaleSchema,
  updateSalePaymentStatusSchema,
  salesFilterSchema,
  salesDayFilterSchema,
  salesRangeFilterSchema,
  saleIdParamSchema,
} = require('./sales.schemas');

const validateCreateSale = validateMiddleware(createSaleSchema, 'body');
const validateUpdateSalePaymentStatus = validateMiddleware(updateSalePaymentStatusSchema, 'body');
const validateSalesFilters = validateMiddleware(salesFilterSchema, 'query');
const validateSalesDayFilters = validateMiddleware(salesDayFilterSchema, 'query');
const validateSalesRangeFilters = validateMiddleware(salesRangeFilterSchema, 'query');
const validateSaleIdParam = validateMiddleware(saleIdParamSchema, 'params');

module.exports = {
  validateCreateSale,
  validateUpdateSalePaymentStatus,
  validateSalesFilters,
  validateSalesDayFilters,
  validateSalesRangeFilters,
  validateSaleIdParam,
};
