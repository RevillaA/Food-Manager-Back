const express = require('express');

const categoriesController = require('./categories.controller');
const categoriesValidator = require('./categories.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/',
  roleMiddleware(ROLES.ADMIN, ROLES.CASHIER),
  categoriesValidator.validateCategoryFilters,
  categoriesController.getCategories
);

router.get(
  '/:id',
  roleMiddleware(ROLES.ADMIN, ROLES.CASHIER),
  categoriesValidator.validateCategoryIdParam,
  categoriesController.getCategoryById
);

router.post(
  '/',
  roleMiddleware(ROLES.ADMIN),
  categoriesValidator.validateCreateCategory,
  categoriesController.createCategory
);

router.patch(
  '/:id',
  roleMiddleware(ROLES.ADMIN),
  categoriesValidator.validateCategoryIdParam,
  categoriesValidator.validateUpdateCategory,
  categoriesController.updateCategory
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.ADMIN),
  categoriesValidator.validateCategoryIdParam,
  categoriesValidator.validateUpdateCategoryStatus,
  categoriesController.updateCategoryStatus
);

module.exports = router;