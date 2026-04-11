const toIsoString = (date = new Date()) => new Date(date).toISOString();

const QUITO_TIME_ZONE = 'America/Guayaquil';

const getTodayDateString = () => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: QUITO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const parts = formatter.formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    const fallbackDate = new Date();
    return fallbackDate.toISOString().split('T')[0];
  }

  return `${year}-${month}-${day}`;
};

const isValidDate = (value) => {
  return !Number.isNaN(new Date(value).getTime());
};

module.exports = {
  toIsoString,
  getTodayDateString,
  isValidDate,
};