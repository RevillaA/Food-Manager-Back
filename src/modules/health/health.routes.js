const express = require('express');
const { query } = require('../../database/pg/pool');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const result = await query('SELECT NOW() AS current_time');

    return res.status(200).json({
      success: true,
      message: 'API running correctly',
      data: {
        serverTime: result.rows[0].current_time,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;