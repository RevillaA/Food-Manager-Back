const express = require('express');

const productsController = require('./products.controller');
const productsValidator = require('./products.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);

router.get(
  '/',
  roleMiddleware(ROLES.ADMIN, ROLES.CASHIER),
  productsValidator.validateProductsFilters,
  productsController.getProducts
);

router.get(
  '/:id',
  roleMiddleware(ROLES.ADMIN, ROLES.CASHIER),
  productsValidator.validateProductIdParam,
  productsController.getProductById
);

router.post(
  '/',
  roleMiddleware(ROLES.ADMIN),
  productsValidator.validateCreateProduct,
  productsController.createProduct
);

router.patch(
  '/:id',
  roleMiddleware(ROLES.ADMIN),
  productsValidator.validateProductIdParam,
  productsValidator.validateUpdateProduct,
  productsController.updateProduct
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.ADMIN),
  productsValidator.validateProductIdParam,
  productsValidator.validateUpdateProductStatus,
  productsController.updateProductStatus
);

module.exports = router;