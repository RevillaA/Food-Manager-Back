const Joi = require('joi');

const uuidField = Joi.string().uuid();

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
});

const idParamSchema = Joi.object({
  id: uuidField.required(),
});

module.exports = {
  uuidField,
  paginationSchema,
  idParamSchema,
};