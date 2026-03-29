const express = require('express');

const salesController = require('./sales.controller');
const salesValidator = require('./sales.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN, ROLES.CASHIER));

router.post(
  '/',
  salesValidator.validateCreateSale,
  salesController.createSale
);

router.get(
  '/',
  salesValidator.validateSalesFilters,
  salesController.getSales
);

router.get(
  '/day',
  salesController.getSalesOfToday
);

router.get(
  '/:id',
  salesValidator.validateSaleIdParam,
  salesController.getSaleById
);

module.exports = router;