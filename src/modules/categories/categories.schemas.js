const Joi = require('joi');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const CATEGORY_TYPES = ['MAIN_DISH', 'DRINK', 'EXTRA', 'SWEET'];

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),
  category_type: Joi.string().valid(...CATEGORY_TYPES).required(),
  description: Joi.string().trim().max(200).allow(null, ''),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).optional(),
  category_type: Joi.string().valid(...CATEGORY_TYPES).optional(),
  description: Joi.string().trim().max(200).allow(null, '').optional(),
}).min(1);

const updateCategoryStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

const categoriesFilterSchema = paginationSchema.keys({
  is_active: Joi.boolean().optional(),
  category_type: Joi.string().valid(...CATEGORY_TYPES).optional(),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  updateCategoryStatusSchema,
  categoriesFilterSchema,
  categoryIdParamSchema: idParamSchema,
};