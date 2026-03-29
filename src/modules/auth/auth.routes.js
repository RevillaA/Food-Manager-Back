const express = require('express');

const authController = require('./auth.controller');
const authValidator = require('./auth.validator');
const authMiddleware = require('../../middlewares/auth.middleware');

const router = express.Router();

router.post('/login', authValidator.validateLogin, authController.login);
router.get('/me', authMiddleware, authController.me);

module.exports = router;