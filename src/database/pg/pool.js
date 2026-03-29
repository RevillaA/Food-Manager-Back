const { Pool } = require('pg');
const env = require('../../config/env');
const logger = require('../../config/logger');

const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  user: env.db.user,
  password: env.db.password,
  ssl: env.db.ssl ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.info('PostgreSQL pool connected');
});

pool.on('error', (error) => {
  logger.error('Unexpected PostgreSQL pool error', {
    message: error.message,
    stack: error.stack,
  });
});

const query = async (text, params = []) => {
  return pool.query(text, params);
};

const getClient = async () => {
  return pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
};