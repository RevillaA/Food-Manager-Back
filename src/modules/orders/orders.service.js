const { pool } = require('../../database/pg/pool');
const { withTransaction } = require('../../database/pg/transaction');

const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const { getPagination } = require('../../common/utils/pagination.util');
const { roundToTwo, toNumber } = require('../../common/utils/number.util');
const { getTodayDateString } = require('../../common/utils/date.util');

const ordersRepository = require('./orders.repository');
const orderItemsRepository = require('./order-items.repository');
const productsRepository = require('../products/products.repository');
const dailySessionsRepository = require('../daily-sessions/daily-sessions.repository');

const ensureOrderIsOpen = (order) => {
  if (order.status === 'CLOSED') {
    throw new BadRequestError('Closed orders cannot be modified');
  }

  if (order.status === 'CANCELLED') {
    throw new BadRequestError('Cancelled orders cannot be modified');
  }
};

const ensureOrderHasItems = async (client, orderId) => {
  const items = await orderItemsRepository.listOrderItemsByOrderId(client, orderId);

  if (!items.length) {
    throw new BadRequestError('Order without items cannot be closed');
  }

  return items;
};

const ensureActiveDailySession = async (client, authenticatedUser) => {
  const activeSession = await dailySessionsRepository.findActiveDailySession(client);

  if (activeSession) {
    return activeSession;
  }

  const today = getTodayDateString();
  const todaySession = await dailySessionsRepository.findDailySessionByDate(client, today);

  if (todaySession && todaySession.status === 'CLOSED') {
    throw new BadRequestError(
      'Today has a closed daily session. An administrator must reopen it before creating orders'
    );
  }

  if (todaySession) {
    return todaySession;
  }

  const created = await dailySessionsRepository.createDailySession(client, {
    session_date: today,
    opened_by_user_id: authenticatedUser.id,
    notes: 'Auto-created when creating an order',
  });

  return dailySessionsRepository.findDailySessionById(client, created.id);
};

const syncOrderPreparationStatus = async (client, orderId) => {
  const preparation_status = await orderItemsRepository.calculateOrderPreparationStatus(client, orderId);

  await ordersRepository.updateOrderPreparationStatus(client, {
    id: orderId,
    preparation_status,
  });
};

const createOrder = async (payload, authenticatedUser) => {
  return withTransaction(async (client) => {
    const dailySession = await ensureActiveDailySession(client, authenticatedUser);

    const order_number = await ordersRepository.getNextOrderNumber(client, dailySession.id);

    const created = await ordersRepository.createOrder(client, {
      daily_session_id: dailySession.id,
      created_by_user_id: authenticatedUser.id,
      order_number,
      notes: payload.notes || null,
    });

    return ordersRepository.findOrderById(client, created.id);
  });
};

const getOrders = async (queryParams) => {
  const client = await pool.connect();

  try {
    const { page, limit, offset } = getPagination(queryParams);

    const filters = {
      status: queryParams.status || undefined,
      preparation_status: queryParams.preparation_status || undefined,
      daily_session_id: queryParams.daily_session_id || undefined,
    };

    const [orders, total] = await Promise.all([
      ordersRepository.listOrders(client, { limit, offset, ...filters }),
      ordersRepository.countOrders(client, filters),
    ]);

    return {
      data: orders,
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

const getOrdersBoard = async (queryParams) => {
  const client = await pool.connect();

  try {
    const { page, limit, offset } = getPagination(queryParams);

    let daily_session_id = queryParams.daily_session_id || undefined;

    if (!daily_session_id) {
      const activeSession = await dailySessionsRepository.findActiveDailySession(client);
      daily_session_id = activeSession ? activeSession.id : undefined;
    }

    const filters = {
      status: queryParams.status || undefined,
      preparation_status: queryParams.preparation_status || undefined,
      payment_state: queryParams.payment_state || undefined,
      daily_session_id,
    };

    const [orders, total] = await Promise.all([
      ordersRepository.listOrdersBoard(client, { limit, offset, ...filters }),
      ordersRepository.countOrdersBoard(client, filters),
    ]);

    return {
      data: orders,
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

const getOpenOrders = async () => {
  const client = await pool.connect();

  try {
    const orders = await ordersRepository.listOrders(client, {
      limit: 100,
      offset: 0,
      status: 'OPEN',
      preparation_status: undefined,
      daily_session_id: undefined,
    });

    return orders;
  } finally {
    client.release();
  }
};

const getOrderById = async (id) => {
  const client = await pool.connect();

  try {
    const order = await ordersRepository.findOrderById(client, id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    const items = await orderItemsRepository.listOrderItemsByOrderId(client, id);

    return { order, items };
  } finally {
    client.release();
  }
};

const addOrderItem = async (orderId, payload) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    ensureOrderIsOpen(order);

    const product = await productsRepository.findProductById(client, payload.product_id);

    if (!product) {
      throw new BadRequestError('Product does not exist');
    }

    if (!product.is_active) {
      throw new BadRequestError('Inactive products cannot be added to orders');
    }

    const unit_price = roundToTwo(toNumber(product.base_price));
    const line_total = roundToTwo(unit_price * payload.quantity);

    const created = await orderItemsRepository.createOrderItem(client, {
      order_id: orderId,
      product_id: product.id,
      product_name: product.name,
      product_category_name: product.category_name,
      quantity: payload.quantity,
      unit_price,
      line_total,
      notes: payload.notes || null,
    });

    await syncOrderPreparationStatus(client, orderId);

    const item = await orderItemsRepository.findOrderItemById(client, created.id);
    const updatedOrder = await ordersRepository.findOrderById(client, orderId);

    return {
      order: updatedOrder,
      item,
    };
  });
};

const updateOrderItem = async (orderId, itemId, payload) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    ensureOrderIsOpen(order);

    const item = await orderItemsRepository.findOrderItemById(client, itemId);

    if (!item || item.order_id !== orderId) {
      throw new NotFoundError('Order item not found');
    }

    const quantity = payload.quantity ?? item.quantity;
    const line_total = roundToTwo(toNumber(item.unit_price) * quantity);

    await orderItemsRepository.updateOrderItem(client, {
      itemId,
      quantity: payload.quantity ?? null,
      line_total,
      notes: payload.notes ?? null,
    });

    await syncOrderPreparationStatus(client, orderId);

    const updatedItem = await orderItemsRepository.findOrderItemById(client, itemId);
    const updatedOrder = await ordersRepository.findOrderById(client, orderId);

    return {
      order: updatedOrder,
      item: updatedItem,
    };
  });
};

const updateOrderItemPreparationStatus = async (orderId, itemId, payload) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    ensureOrderIsOpen(order);

    const item = await orderItemsRepository.findOrderItemById(client, itemId);

    if (!item || item.order_id !== orderId) {
      throw new NotFoundError('Order item not found');
    }

    if (item.preparation_status === payload.preparation_status) {
      throw new BadRequestError(`Order item is already ${payload.preparation_status}`);
    }

    await orderItemsRepository.updateOrderItemPreparationStatus(client, {
      itemId,
      preparation_status: payload.preparation_status,
    });

    await syncOrderPreparationStatus(client, orderId);

    const updatedItem = await orderItemsRepository.findOrderItemById(client, itemId);
    const updatedOrder = await ordersRepository.findOrderById(client, orderId);

    return {
      order: updatedOrder,
      item: updatedItem,
    };
  });
};

const removeOrderItem = async (orderId, itemId) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    ensureOrderIsOpen(order);

    const item = await orderItemsRepository.findOrderItemById(client, itemId);

    if (!item || item.order_id !== orderId) {
      throw new NotFoundError('Order item not found');
    }

    await orderItemsRepository.deleteOrderItem(client, itemId);

    await syncOrderPreparationStatus(client, orderId);

    const updatedOrder = await ordersRepository.findOrderById(client, orderId);

    return updatedOrder;
  });
};

const cancelOrder = async (orderId, payload) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestError('Order is already cancelled');
    }

    if (order.status === 'CLOSED') {
      throw new BadRequestError('Closed orders cannot be cancelled');
    }

    await ordersRepository.cancelOrder(client, {
      id: orderId,
      notes: payload.notes ?? null,
    });

    return ordersRepository.findOrderById(client, orderId);
  });
};

const closeOrder = async (orderId, payload) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, orderId);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === 'CLOSED') {
      throw new BadRequestError('Order is already closed');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestError('Cancelled orders cannot be closed');
    }

    await ensureOrderHasItems(client, orderId);

    await ordersRepository.closeOrder(client, {
      id: orderId,
      notes: payload.notes ?? null,
    });

    return ordersRepository.findOrderById(client, orderId);
  });
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