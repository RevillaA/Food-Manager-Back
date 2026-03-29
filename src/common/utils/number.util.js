const toNumber = (value, defaultValue = 0) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? defaultValue : parsed;
};

const roundToTwo = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const isPositiveNumber = (value) => {
  return typeof value === 'number' && value > 0;
};

module.exports = {
  toNumber,
  roundToTwo,
  isPositiveNumber,
};