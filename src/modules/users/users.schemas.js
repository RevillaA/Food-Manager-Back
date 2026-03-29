const Joi = require('joi');
const ROLES = require('../../common/constants/roles.constants');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const createUserSchema = Joi.object({
  full_name: Joi.string().trim().min(3).max(120).required(),
  username: Joi.string().trim().min(3).max(50).required(),
  email: Joi.string().trim().email().max(120).allow(null, ''),
  password: Joi.string().min(6).max(100).required(),
  role_name: Joi.string()
    .valid(ROLES.ADMIN, ROLES.CASHIER)
    .required(),
});

const updateUserSchema = Joi.object({
  full_name: Joi.string().trim().min(3).max(120).optional(),
  username: Joi.string().trim().min(3).max(50).optional(),
  email: Joi.string().trim().email().max(120).allow(null, '').optional(),
  role_name: Joi.string()
    .valid(ROLES.ADMIN, ROLES.CASHIER)
    .optional(),
}).min(1);

const updateUserStatusSchema = Joi.object({
  is_active: Joi.boolean().required(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema: idParamSchema,
  usersPaginationSchema: paginationSchema,
};