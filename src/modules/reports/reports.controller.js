const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const reportsService = require('./reports.service');
const reportsMapper = require('./reports.mapper');

const getDailySalesReport = async (req, res, next) => {
  try {
    const report = await reportsService.getDailySalesReport(req.query);

    return ApiResponse.success({
      res,
      message: 'Daily sales report retrieved successfully',
      data: reportsMapper.toDailySalesReportResponse(report),
    });
  } catch (error) {
    return next(error);
  }
};

const getSalesRangeReport = async (req, res, next) => {
  try {
    const result = await reportsService.getSalesRangeReport(req.query);

    return PaginationResponse.send({
      res,
      message: 'Sales range report retrieved successfully',
      data: reportsMapper.toSalesRangeReportResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getTopSellingProductsReport = async (req, res, next) => {
  try {
    const products = await reportsService.getTopSellingProductsReport(req.query);

    return ApiResponse.success({
      res,
      message: 'Top selling products report retrieved successfully',
      data: reportsMapper.toTopProductsReportResponse(products),
    });
  } catch (error) {
    return next(error);
  }
};

const getCategorySummaryReport = async (req, res, next) => {
  try {
    const report = await reportsService.getCategorySummaryReport(req.query);

    return ApiResponse.success({
      res,
      message: 'Category sales summary retrieved successfully',
      data: reportsMapper.toCategorySummaryReportResponse(report),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDailySalesReport,
  getSalesRangeReport,
  getTopSellingProductsReport,
  getCategorySummaryReport,
};