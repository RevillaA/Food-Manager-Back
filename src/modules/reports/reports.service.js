const { pool } = require('../../database/pg/pool');
const BadRequestError = require('../../common/errors/bad-request-error');
const { getPagination } = require('../../common/utils/pagination.util');
const { getTodayDateString } = require('../../common/utils/date.util');

const reportsRepository = require('./reports.repository');

const normalizeDateInput = (value) => {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        return value.slice(0, 10);
    }

    return new Date(value).toISOString().slice(0, 10);
};

const validateDateRange = (date_from, date_to) => {
  if (new Date(date_from) > new Date(date_to)) {
    throw new BadRequestError('date_from cannot be greater than date_to');
  }
};

const getDailySalesReport = async (queryParams) => {
  const client = await pool.connect();

  try {
    const date = queryParams.date ? normalizeDateInput(queryParams.date) : getTodayDateString();

    const [summary, sales, categoryTotals] = await Promise.all([
      reportsRepository.getDailySalesSummary(client, date),
      reportsRepository.listDailySales(client, date),
      reportsRepository.getDailyCategoryTotals(client, date),
    ]);

    const totals_by_category = {
      MAIN_DISH: 0,
      DRINK: 0,
      EXTRA: 0,
      SWEET: 0,
    };

    categoryTotals.forEach((row) => {
      if (totals_by_category[row.category_key] !== undefined) {
        totals_by_category[row.category_key] = Number(row.total_amount);
      }
    });

    return {
      date,
      total_sales_amount: summary.total_sales_amount,
      total_sales_count: summary.total_sales_count,
      totals_by_category,
      sales,
    };
  } finally {
    client.release();
  }
};

const getSalesRangeReport = async (queryParams) => {
  const client = await pool.connect();

  try {
    const date_from = normalizeDateInput(queryParams.date_from);
    const date_to = normalizeDateInput(queryParams.date_to);

    validateDateRange(date_from, date_to);

    const { page, limit, offset } = getPagination(queryParams);

    const [summary, sales, total] = await Promise.all([
      reportsRepository.getSalesRangeSummary(client, date_from, date_to),
      reportsRepository.listSalesRange(client, {
        date_from,
        date_to,
        limit,
        offset,
      }),
      reportsRepository.countSalesRange(client, {
        date_from,
        date_to,
      }),
    ]);

    return {
      data: {
        summary: {
          date_from,
          date_to,
          total_sales_amount: summary.total_sales_amount,
          total_sales_count: summary.total_sales_count,
        },
        sales,
      },
      meta: {
        page,
        limit,
        total,
      },
    };
  } finally {
    client.release();
  }
};

const getTopSellingProductsReport = async (queryParams) => {
  const client = await pool.connect();

  try {
    const date_from = normalizeDateInput(queryParams.date_from);
    const date_to = normalizeDateInput(queryParams.date_to);

    validateDateRange(date_from, date_to);

    return reportsRepository.getTopSellingProducts(client, {
      date_from,
      date_to,
      limit: queryParams.limit,
    });
  } finally {
    client.release();
  }
};

const getCategorySummaryReport = async (queryParams) => {
  const client = await pool.connect();

  try {
    const date_from = normalizeDateInput(queryParams.date_from);
    const date_to = normalizeDateInput(queryParams.date_to);

    validateDateRange(date_from, date_to);

    const categories = await reportsRepository.getCategorySummary(client, {
      date_from,
      date_to,
    });

    return {
      date_from,
      date_to,
      categories,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getDailySalesReport,
  getSalesRangeReport,
  getTopSellingProductsReport,
  getCategorySummaryReport,
};