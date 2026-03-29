const toIsoString = (date = new Date()) => new Date(date).toISOString();

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

const isValidDate = (value) => {
  return !Number.isNaN(new Date(value).getTime());
};

module.exports = {
  toIsoString,
  getTodayDateString,
  isValidDate,
};