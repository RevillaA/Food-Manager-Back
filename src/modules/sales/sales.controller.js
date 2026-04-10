const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const salesService = require('./sales.service');
const salesMapper = require('./sales.mapper');

const createSale = async (req, res, next) => {
  try {
    const result = await salesService.createSale(req.body, req.user);

    return ApiResponse.success({
      res,
      message: 'Sale created successfully',
      data: salesMapper.toSaleDetailResponse(result.sale, result.items),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const updateSalePaymentStatus = async (req, res, next) => {
  try {
    const result = await salesService.updateSalePaymentStatus(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Sale payment status updated successfully',
      data: salesMapper.toSaleDetailResponse(result.sale, result.items),
    });
  } catch (error) {
    return next(error);
  }
};

const getSales = async (req, res, next) => {
  try {
    const result = await salesService.getSales(req.query);

    return PaginationResponse.send({
      res,
      message: 'Sales retrieved successfully',
      data: salesMapper.toSalesListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getSaleById = async (req, res, next) => {
  try {
    const result = await salesService.getSaleById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'Sale retrieved successfully',
      data: salesMapper.toSaleDetailResponse(result.sale, result.items),
    });
  } catch (error) {
    return next(error);
  }
};

const getSalesOfToday = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const result = await salesService.getSalesByDay(req.query);

    return PaginationResponse.send({
      res,
      message: 'Day sales retrieved successfully',
      data: salesMapper.toSalesListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getSalesByRange = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');

    const result = await salesService.getSalesByRange(req.query);

    return PaginationResponse.send({
      res,
      message: 'Range sales retrieved successfully',
      data: salesMapper.toSalesListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createSale,
  updateSalePaymentStatus,
  getSales,
  getSaleById,
  getSalesOfToday,
  getSalesByRange,
};
