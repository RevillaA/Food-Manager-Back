const express = require('express');

const dailySessionsController = require('./daily-sessions.controller');
const dailySessionsValidator = require('./daily-sessions.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');
const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN, ROLES.CASHIER));

router.post(
  '/open',
  dailySessionsValidator.validateOpenDailySession,
  dailySessionsController.openDailySession
);

router.get(
  '/active',
  dailySessionsController.getActiveDailySession
);

router.get(
  '/',
  dailySessionsValidator.validateDailySessionsFilters,
  dailySessionsController.getDailySessions
);

router.get(
  '/:id',
  dailySessionsValidator.validateDailySessionIdParam,
  dailySessionsController.getDailySessionById
);

router.patch(
  '/:id/close',
  dailySessionsValidator.validateDailySessionIdParam,
  dailySessionsValidator.validateCloseDailySession,
  dailySessionsController.closeDailySession
);

router.patch(
  '/:id/status',
  roleMiddleware(ROLES.ADMIN),
  dailySessionsValidator.validateDailySessionIdParam,
  dailySessionsValidator.validateUpdateDailySessionStatus,
  dailySessionsController.updateDailySessionStatus
);

module.exports = router;