const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  salesDayReportSchema,
  salesRangeReportSchema,
  topProductsReportSchema,
  categorySummaryReportSchema,
} = require('./reports.schemas');

const validateSalesDayReport = validateMiddleware(salesDayReportSchema, 'query');
const validateSalesRangeReport = validateMiddleware(salesRangeReportSchema, 'query');
const validateTopProductsReport = validateMiddleware(topProductsReportSchema, 'query');
const validateCategorySummaryReport = validateMiddleware(categorySummaryReportSchema, 'query');

module.exports = {
  validateSalesDayReport,
  validateSalesRangeReport,
  validateTopProductsReport,
  validateCategorySummaryReport,
};