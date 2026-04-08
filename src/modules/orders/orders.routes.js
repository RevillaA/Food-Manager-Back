const express = require('express');

const ordersController = require('./orders.controller');
const ordersValidator = require('./orders.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN, ROLES.CASHIER));

router.post(
  '/',
  ordersValidator.validateCreateOrder,
  ordersController.createOrder
);

router.get(
  '/',
  ordersValidator.validateOrdersFilters,
  ordersController.getOrders
);

router.get(
  '/board',
  ordersValidator.validateOrdersBoardFilters,
  ordersController.getOrdersBoard
);

router.get(
  '/open',
  ordersController.getOpenOrders
);

router.get(
  '/:id',
  ordersValidator.validateOrderIdParam,
  ordersController.getOrderById
);

router.post(
  '/:id/items',
  ordersValidator.validateOrderIdParam,
  ordersValidator.validateAddOrderItem,
  ordersController.addOrderItem
);

router.patch(
  '/:id/items/:itemId',
  ordersValidator.validateOrderItemIdParam,
  ordersValidator.validateUpdateOrderItem,
  ordersController.updateOrderItem
);

router.patch(
  '/:id/items/:itemId/preparation-status',
  ordersValidator.validateOrderItemIdParam,
  ordersValidator.validateUpdateOrderItemPreparationStatus,
  ordersController.updateOrderItemPreparationStatus
);

router.delete(
  '/:id/items/:itemId',
  ordersValidator.validateOrderItemIdParam,
  ordersController.removeOrderItem
);

router.patch(
  '/:id/cancel',
  ordersValidator.validateOrderIdParam,
  ordersValidator.validateCancelOrder,
  ordersController.cancelOrder
);

router.patch(
  '/:id/close',
  ordersValidator.validateOrderIdParam,
  ordersValidator.validateCloseOrder,
  ordersController.closeOrder
);

module.exports = router;