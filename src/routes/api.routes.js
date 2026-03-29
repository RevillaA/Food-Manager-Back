const express = require('express');

const healthRoutes = require('../modules/health/health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const categoriesRoutes = require('../modules/categories/categories.routes');
const productsRoutes = require('../modules/products/products.routes');
const dailySessionsRoutes = require('../modules/daily-sessions/daily-sessions.routes');
const ordersRoutes = require('../modules/orders/orders.routes');
const salesRoutes = require('../modules/sales/sales.routes');
const reportsRoutes = require('../modules/reports/reports.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/categories', categoriesRoutes);
router.use('/products', productsRoutes);
router.use('/daily-sessions', dailySessionsRoutes);
router.use('/orders', ordersRoutes);
router.use('/sales', salesRoutes);
router.use('/reports', reportsRoutes);

module.exports = router;