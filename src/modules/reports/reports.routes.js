const express = require('express');

const reportsController = require('./reports.controller');
const reportsValidator = require('./reports.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN, ROLES.CASHIER));

router.get(
  '/sales/day',
  reportsValidator.validateSalesDayReport,
  reportsController.getDailySalesReport
);

router.get(
  '/sales/range',
  reportsValidator.validateSalesRangeReport,
  reportsController.getSalesRangeReport
);

router.get(
  '/products/top',
  reportsValidator.validateTopProductsReport,
  reportsController.getTopSellingProductsReport
);

router.get(
  '/categories/summary',
  reportsValidator.validateCategorySummaryReport,
  reportsController.getCategorySummaryReport
);

module.exports = router;