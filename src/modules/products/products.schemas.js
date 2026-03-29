const Joi = require('joi');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const createProductSchema = Joi.object({
  category_id: Joi.string().uuid().required(),
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(250).allow(null, ''),
  base_price: Joi.number().positive().precision(2).required(),
});

const updateProductSchema = Joi.object({
  category_id: Joi.string().uuid().optional(),
  name: Joi.string().trim().min(2).max(120).optional(),
  description: Joi.string().trim().max(250).allow(null, '').optional(),
  base_price: Joi.number().positive().precision(2).optional(),
}).min(1);

const updateProductStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

const productsFilterSchema = paginationSchema.keys({
  is_active: Joi.boolean().optional(),
  category_id: Joi.string().uuid().optional(),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  updateProductStatusSchema,
  productsFilterSchema,
  productIdParamSchema: idParamSchema,
};