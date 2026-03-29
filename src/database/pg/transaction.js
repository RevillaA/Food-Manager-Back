const { getClient } = require('./pool');

const withTransaction = async (callback) => {
  const client = await getClient();

  try {
    await client.query('BEGIN');

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  withTransaction,
};