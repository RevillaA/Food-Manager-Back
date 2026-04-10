/**
 * Generate human-readable sale identifier
 * Format: YYYYMMDD_ORDERNUMBER_USERINITIAL
 * Example: 20260408_0001_A
 *
 * @param {Date|string} sessionDate - Daily session date (YYYY-MM-DD format or Date object)
 * @param {number} orderNumber - Sequential order number
 * @param {string} userName - User full name (to extract initial)
 * @returns {string} - Sale identifier
 */
const generateSaleIdentifier = (sessionDate, orderNumber, userName) => {
  let dateString;
  if (typeof sessionDate === 'string') {
    dateString = sessionDate.replace(/-/g, '');
  } else if (sessionDate instanceof Date) {
    dateString = sessionDate.toISOString().slice(0, 10).replace(/-/g, '');
  } else {
    throw new Error('Invalid session date format');
  }

  const paddedOrderNumber = String(orderNumber).padStart(3, '0');

  const names = userName.trim().split(/\s+/);
  const userInitial = names[names.length - 1]?.[0]?.toUpperCase() || 'X';

  return `${dateString}_${paddedOrderNumber}_${userInitial}`;
};

module.exports = {
  generateSaleIdentifier,
};
