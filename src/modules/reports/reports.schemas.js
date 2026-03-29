const Joi = require('joi');
const { paginationSchema } = require('../../common/validators/common.schemas');

const salesDayReportSchema = Joi.object({
  date: Joi.date().iso().optional(),
});

const salesRangeReportSchema = paginationSchema.keys({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
});

const topProductsReportSchema = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
  limit: Joi.number().integer().min(1).max(50).default(3),
});

const categorySummaryReportSchema = Joi.object({
  date_from: Joi.date().iso().required(),
  date_to: Joi.date().iso().required(),
});

module.exports = {
  salesDayReportSchema,
  salesRangeReportSchema,
  topProductsReportSchema,
  categorySummaryReportSchema,
};