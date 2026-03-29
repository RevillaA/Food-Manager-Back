const Joi = require('joi');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const PAYMENT_STATUS = ['PAID', 'PENDING'];
const PAYMENT_METHOD = ['CASH', 'TRANSFER'];

const createSaleSchema = Joi.object({
  order_id: Joi.string().uuid().required(),
  payment_status: Joi.string().valid(...PAYMENT_STATUS).required(),
  payment_method: Joi.string().valid(...PAYMENT_METHOD).required(),
  notes: Joi.string().trim().max(250).allow(null, ''),
});

const salesFilterSchema = paginationSchema.keys({
  daily_session_id: Joi.string().uuid().optional(),
  payment_status: Joi.string().valid(...PAYMENT_STATUS).optional(),
  payment_method: Joi.string().valid(...PAYMENT_METHOD).optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
});

module.exports = {
  createSaleSchema,
  salesFilterSchema,
  saleIdParamSchema: idParamSchema,
};