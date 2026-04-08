const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const ordersService = require('./orders.service');
const ordersMapper = require('./orders.mapper');

const createOrder = async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body, req.user);

    return ApiResponse.success({
      res,
      message: 'Order created successfully',
      data: ordersMapper.toOrderResponse(order),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const result = await ordersService.getOrders(req.query);

    return PaginationResponse.send({
      res,
      message: 'Orders retrieved successfully',
      data: ordersMapper.toOrdersListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getOrdersBoard = async (req, res, next) => {
  try {
    const result = await ordersService.getOrdersBoard(req.query);

    return PaginationResponse.send({
      res,
      message: 'Orders board retrieved successfully',
      data: ordersMapper.toOrdersListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getOpenOrders = async (req, res, next) => {
  try {
    const orders = await ordersService.getOpenOrders();

    return ApiResponse.success({
      res,
      message: 'Open orders retrieved successfully',
      data: ordersMapper.toOrdersListResponse(orders),
    });
  } catch (error) {
    return next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const result = await ordersService.getOrderById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'Order retrieved successfully',
      data: ordersMapper.toOrderDetailResponse(result.order, result.items),
    });
  } catch (error) {
    return next(error);
  }
};

const addOrderItem = async (req, res, next) => {
  try {
    const result = await ordersService.addOrderItem(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Order item added successfully',
      data: {
        order: ordersMapper.toOrderResponse(result.order),
        item: ordersMapper.toOrderItemResponse(result.item),
      },
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderItem = async (req, res, next) => {
  try {
    const result = await ordersService.updateOrderItem(
      req.params.id,
      req.params.itemId,
      req.body
    );

    return ApiResponse.success({
      res,
      message: 'Order item updated successfully',
      data: {
        order: ordersMapper.toOrderResponse(result.order),
        item: ordersMapper.toOrderItemResponse(result.item),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const updateOrderItemPreparationStatus = async (req, res, next) => {
  try {
    const result = await ordersService.updateOrderItemPreparationStatus(
      req.params.id,
      req.params.itemId,
      req.body
    );

    return ApiResponse.success({
      res,
      message: 'Order item preparation status updated successfully',
      data: {
        order: ordersMapper.toOrderResponse(result.order),
        item: ordersMapper.toOrderItemResponse(result.item),
      },
    });
  } catch (error) {
    return next(error);
  }
};

const removeOrderItem = async (req, res, next) => {
  try {
    const order = await ordersService.removeOrderItem(req.params.id, req.params.itemId);

    return ApiResponse.success({
      res,
      message: 'Order item removed successfully',
      data: ordersMapper.toOrderResponse(order),
    });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const order = await ordersService.cancelOrder(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Order cancelled successfully',
      data: ordersMapper.toOrderResponse(order),
    });
  } catch (error) {
    return next(error);
  }
};

const closeOrder = async (req, res, next) => {
  try {
    const order = await ordersService.closeOrder(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Order closed successfully',
      data: ordersMapper.toOrderResponse(order),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrdersBoard,
  getOpenOrders,
  getOrderById,
  addOrderItem,
  updateOrderItem,
  updateOrderItemPreparationStatus,
  removeOrderItem,
  cancelOrder,
  closeOrder,
};