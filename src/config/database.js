const { query } = require('../database/pg/pool');
const logger = require('./logger');

const connectDatabase = async () => {
  try {
    const result = await query('SELECT current_database() AS database_name, NOW() AS server_time');

    logger.info('Database connection established successfully', {
      database: result.rows[0].database_name,
      serverTime: result.rows[0].server_time,
    });
  } catch (error) {
    logger.error('Failed to connect to database', {
      message: error.message,
      stack: error.stack,
    });

    throw error;
  }
};

module.exports = {
  connectDatabase,
};