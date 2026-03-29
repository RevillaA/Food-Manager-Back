const Joi = require('joi');
const { idParamSchema, paginationSchema } = require('../../common/validators/common.schemas');

const DAILY_SESSION_STATUS = ['OPEN', 'CLOSED'];

const openDailySessionSchema = Joi.object({
  session_date: Joi.date().iso().optional(),
  notes: Joi.string().trim().max(250).allow(null, ''),
});

const closeDailySessionSchema = Joi.object({
  notes: Joi.string().trim().max(250).allow(null, ''),
});

const updateDailySessionStatusSchema = Joi.object({
  status: Joi.string().valid(...DAILY_SESSION_STATUS).required(),
});

const dailySessionsFilterSchema = paginationSchema.keys({
  status: Joi.string().valid(...DAILY_SESSION_STATUS).optional(),
  session_date: Joi.date().iso().optional(),
});

module.exports = {
  openDailySessionSchema,
  closeDailySessionSchema,
  updateDailySessionStatusSchema,
  dailySessionsFilterSchema,
  dailySessionIdParamSchema: idParamSchema,
};