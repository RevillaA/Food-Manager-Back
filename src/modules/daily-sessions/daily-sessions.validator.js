const validateMiddleware = require('../../middlewares/validate.middleware');
const {
  openDailySessionSchema,
  closeDailySessionSchema,
  updateDailySessionStatusSchema,
  dailySessionsFilterSchema,
  dailySessionIdParamSchema,
} = require('./daily-sessions.schemas');

const validateOpenDailySession = validateMiddleware(openDailySessionSchema, 'body');
const validateCloseDailySession = validateMiddleware(closeDailySessionSchema, 'body');
const validateUpdateDailySessionStatus = validateMiddleware(
  updateDailySessionStatusSchema,
  'body'
);
const validateDailySessionsFilters = validateMiddleware(dailySessionsFilterSchema, 'query');
const validateDailySessionIdParam = validateMiddleware(dailySessionIdParamSchema, 'params');

module.exports = {
  validateOpenDailySession,
  validateCloseDailySession,
  validateUpdateDailySessionStatus,
  validateDailySessionsFilters,
  validateDailySessionIdParam,
};