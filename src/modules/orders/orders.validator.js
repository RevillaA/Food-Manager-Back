const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  createOrderSchema,
  ordersFilterSchema,
  ordersBoardFilterSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  updateOrderItemPreparationStatusSchema,
  cancelOrderSchema,
  closeOrderSchema,
  orderIdParamSchema,
  orderItemIdParamSchema,
} = require('./orders.schemas');

const validateCreateOrder = validateMiddleware(createOrderSchema, 'body');
const validateOrdersFilters = validateMiddleware(ordersFilterSchema, 'query');
const validateOrdersBoardFilters = validateMiddleware(ordersBoardFilterSchema, 'query');
const validateAddOrderItem = validateMiddleware(addOrderItemSchema, 'body');
const validateUpdateOrderItem = validateMiddleware(updateOrderItemSchema, 'body');
const validateUpdateOrderItemPreparationStatus = validateMiddleware(updateOrderItemPreparationStatusSchema,'body');
const validateCancelOrder = validateMiddleware(cancelOrderSchema, 'body');
const validateCloseOrder = validateMiddleware(closeOrderSchema, 'body');
const validateOrderIdParam = validateMiddleware(orderIdParamSchema, 'params');
const validateOrderItemIdParam = validateMiddleware(orderItemIdParamSchema, 'params');
module.exports = {
  validateCreateOrder,
  validateOrdersFilters,
  validateOrdersBoardFilters,
  validateAddOrderItem,
  validateUpdateOrderItem,
  validateUpdateOrderItemPreparationStatus,
  validateCancelOrder,
  validateCloseOrder,
  validateOrderIdParam,
  validateOrderItemIdParam,
};