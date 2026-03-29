const express = require('express');

const usersController = require('./users.controller');
const usersValidator = require('./users.validator');

const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

const ROLES = require('../../common/constants/roles.constants');

const router = express.Router();

router.use(authMiddleware);
router.use(roleMiddleware(ROLES.ADMIN));

router.post(
  '/',
  usersValidator.validateCreateUser,
  usersController.createUser
);

router.get(
  '/',
  usersValidator.validateUsersPagination,
  usersController.getUsers
);

router.get(
  '/:id',
  usersValidator.validateUserIdParam,
  usersController.getUserById
);

router.patch(
  '/:id',
  usersValidator.validateUserIdParam,
  usersValidator.validateUpdateUser,
  usersController.updateUser
);

router.patch(
  '/:id/status',
  usersValidator.validateUserIdParam,
  usersValidator.validateUpdateUserStatus,
  usersController.updateUserStatus
);

module.exports = router;