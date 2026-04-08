const Joi = require('joi');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const ORDER_STATUS = ['OPEN', 'CLOSED', 'CANCELLED'];
const PREPARATION_STATUS = ['IN_PROGRESS', 'SERVED'];
const PAYMENT_STATE = ['UNPAID', 'PENDING', 'PAID'];

const createOrderSchema = Joi.object({
  notes: Joi.string().trim().max(250).allow(null, ''),
});

const ordersFilterSchema = paginationSchema.keys({
  status: Joi.string().valid(...ORDER_STATUS).optional(),
  preparation_status: Joi.string().valid(...PREPARATION_STATUS).optional(),
  daily_session_id: Joi.string().uuid().optional(),
});

const ordersBoardFilterSchema = paginationSchema.keys({
  status: Joi.string().valid(...ORDER_STATUS).optional(),
  preparation_status: Joi.string().valid(...PREPARATION_STATUS).optional(),
  payment_state: Joi.string().valid(...PAYMENT_STATE).optional(),
  daily_session_id: Joi.string().uuid().optional(),
});

const addOrderItemSchema = Joi.object({
  product_id: Joi.string().uuid().required(),
  quantity: Joi.number().integer().min(1).required(),
  notes: Joi.string().trim().max(200).allow(null, ''),
});

const updateOrderItemSchema = Joi.object({
  quantity: Joi.number().integer().min(1).optional(),
  notes: Joi.string().trim().max(200).allow(null, '').optional(),
}).min(1);

const updateOrderItemPreparationStatusSchema = Joi.object({
  preparation_status: Joi.string().valid(...PREPARATION_STATUS).required(),
});

const orderItemIdParamSchema = Joi.object({
  id: Joi.string().uuid().required(),
  itemId: Joi.string().uuid().required(),
});

const cancelOrderSchema = Joi.object({
  notes: Joi.string().trim().max(250).allow(null, ''),
});

const closeOrderSchema = Joi.object({
  notes: Joi.string().trim().max(250).allow(null, ''),
});

module.exports = {
  createOrderSchema,
  ordersFilterSchema,
  ordersBoardFilterSchema,
  addOrderItemSchema,
  updateOrderItemSchema,
  updateOrderItemPreparationStatusSchema,
  cancelOrderSchema,
  closeOrderSchema,
  orderIdParamSchema: idParamSchema,
  orderItemIdParamSchema,
};