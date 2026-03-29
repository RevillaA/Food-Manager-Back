const NotFoundError = require('../../common/errors/not-found-error');

const getRows = (result) => {
  return result.rows;
};

const getFirstRow = (result) => {
  return result.rows[0] || null;
};

const requireFirstRow = (result, message = 'Resource not found') => {
  const row = getFirstRow(result);

  if (!row) {
    throw new NotFoundError(message);
  }

  return row;
};

const getRowCount = (result) => {
  return result.rowCount || 0;
};

const hasRows = (result) => {
  return getRowCount(result) > 0;
};

module.exports = {
  getRows,
  getFirstRow,
  requireFirstRow,
  getRowCount,
  hasRows,
};