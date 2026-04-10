const { pool } = require('../../database/pg/pool');
const { withTransaction } = require('../../database/pg/transaction');

const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const ConflictError = require('../../common/errors/conflict-error');
const { getPagination } = require('../../common/utils/pagination.util');
const { getTodayDateString } = require('../../common/utils/date.util');
const { generateSaleIdentifier } = require('./sales.util');

const salesRepository = require('./sales.repository');
const saleItemsRepository = require('./sale-items.repository');
const ordersRepository = require('../orders/orders.repository');
const orderItemsRepository = require('../orders/order-items.repository');
const dailySessionsRepository = require('../daily-sessions/daily-sessions.repository');

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

const attachSaleItems = async (client, sales = []) => {
  if (!sales.length) {
    return [];
  }

  const saleIds = sales.map((sale) => sale.id);
  const items = await saleItemsRepository.listSaleItemsBySaleIds(client, saleIds);
  const itemsBySaleId = new Map();

  items.forEach((item) => {
    if (!itemsBySaleId.has(item.sale_id)) {
      itemsBySaleId.set(item.sale_id, []);
    }

    itemsBySaleId.get(item.sale_id).push(item);
  });

  return sales.map((sale) => ({
    ...sale,
    items: itemsBySaleId.get(sale.id) || [],
  }));
};

const createSale = async (payload, authenticatedUser) => {
  return withTransaction(async (client) => {
    const order = await ordersRepository.findOrderById(client, payload.order_id);

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestError('Cancelled orders cannot generate sales');
    }

    if (order.status !== 'CLOSED') {
      throw new BadRequestError('Only closed orders can generate sales');
    }

    const existingSale = await salesRepository.findSaleByOrderId(client, payload.order_id);

    if (existingSale) {
      throw new ConflictError('This order already has a sale');
    }

    const orderItems = await orderItemsRepository.listOrderItemsByOrderId(client, payload.order_id);

    if (!orderItems.length) {
      throw new BadRequestError('Orders without items cannot generate sales');
    }

    // Get daily session to obtain session_date for sale identifier
    const dailySession = await dailySessionsRepository.findDailySessionById(
      client,
      order.daily_session_id
    );

    if (!dailySession) {
      throw new NotFoundError('Daily session not found');
    }

    const sale_number = await salesRepository.getNextSaleNumber(client, order.daily_session_id);

    // Generate sale identifier: YYYYMMDD_ORDERNUMBER_USERINITIAL
    const sale_identifier = generateSaleIdentifier(
      dailySession.session_date,
      order.order_number,
      order.created_by_full_name
    );

    const paid_at = payload.payment_status === 'PAID' ? new Date().toISOString() : null;

    const createdSale = await salesRepository.createSale(client, {
      daily_session_id: order.daily_session_id,
      order_id: order.id,
      created_by_user_id: authenticatedUser.id,
      sale_number,
      sale_identifier,
      payment_status: payload.payment_status,
      payment_method: payload.payment_method,
      subtotal: order.subtotal,
      total: order.subtotal,
      paid_at,
      notes: payload.notes || null,
    });

    for (const item of orderItems) {
      await saleItemsRepository.createSaleItem(client, {
        sale_id: createdSale.id,
        product_id: item.product_id,
        product_name: item.product_name,
        product_category_name: item.product_category_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.line_total,
      });
    }

    const sale = await salesRepository.findSaleById(client, createdSale.id);
    const saleItems = await saleItemsRepository.listSaleItemsBySaleId(client, createdSale.id);

    return {
      sale,
      items: saleItems,
    };
  });
};

const updateSalePaymentStatus = async (id, payload) => {
  return withTransaction(async (client) => {
    const sale = await salesRepository.findSaleById(client, id);

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.payment_status === payload.payment_status) {
      throw new BadRequestError(`Sale is already ${payload.payment_status}`);
    }

    const paid_at = payload.payment_status === 'PAID' ? new Date().toISOString() : null;

    await salesRepository.updateSalePaymentStatus(client, {
      id,
      payment_status: payload.payment_status,
      paid_at,
    });

    const updatedSale = await salesRepository.findSaleById(client, id);
    const items = await saleItemsRepository.listSaleItemsBySaleId(client, id);

    return {
      sale: updatedSale,
      items,
    };
  });
};

const getSales = async (queryParams) => {
  const client = await pool.connect();

  try {
    const { page, limit, offset } = getPagination(queryParams);

    const filters = {
      daily_session_id: queryParams.daily_session_id || undefined,
      payment_status: queryParams.payment_status || undefined,
      payment_method: queryParams.payment_method || undefined,
      date_from: queryParams.date_from || undefined,
      date_to: queryParams.date_to || undefined,
    };

    const [sales, total] = await Promise.all([
      salesRepository.listSales(client, { limit, offset, ...filters }),
      salesRepository.countSales(client, filters),
    ]);

    const data = queryParams.include_items ? await attachSaleItems(client, sales) : sales;

    return {
      data,
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

const getSaleById = async (id) => {
  const client = await pool.connect();

  try {
    const sale = await salesRepository.findSaleById(client, id);

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    const items = await saleItemsRepository.listSaleItemsBySaleId(client, id);

    return {
      sale,
      items,
    };
  } finally {
    client.release();
  }
};

const getSalesOfToday = async () => {
  return getSalesByDay({});
};

const getSalesByDay = async (queryParams) => {
  const client = await pool.connect();

  try {
    const { page, limit, offset } = getPagination(queryParams);
    const date = queryParams.date ? normalizeDateInput(queryParams.date) : getTodayDateString();

    const filters = {
      daily_session_id: queryParams.daily_session_id || undefined,
      payment_status: queryParams.payment_status || undefined,
      payment_method: queryParams.payment_method || undefined,
      session_date_from: date,
      session_date_to: date,
    };

    const [sales, total] = await Promise.all([
      salesRepository.listSalesBySessionDateRange(client, { limit, offset, ...filters }),
      salesRepository.countSalesBySessionDateRange(client, filters),
    ]);

    const data = queryParams.include_items ? await attachSaleItems(client, sales) : sales;

    return {
      data,
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

const getSalesByRange = async (queryParams) => {
  const client = await pool.connect();

  try {
    const { page, limit, offset } = getPagination(queryParams);
    const date_from = normalizeDateInput(queryParams.date_from);
    const date_to = normalizeDateInput(queryParams.date_to);

    validateDateRange(date_from, date_to);

    const filters = {
      daily_session_id: queryParams.daily_session_id || undefined,
      payment_status: queryParams.payment_status || undefined,
      payment_method: queryParams.payment_method || undefined,
      session_date_from: date_from,
      session_date_to: date_to,
    };

    const [sales, total] = await Promise.all([
      salesRepository.listSalesBySessionDateRange(client, { limit, offset, ...filters }),
      salesRepository.countSalesBySessionDateRange(client, filters),
    ]);

    const data = queryParams.include_items ? await attachSaleItems(client, sales) : sales;

    return {
      data,
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

module.exports = {
  createSale,
  updateSalePaymentStatus,
  getSales,
  getSaleById,
  getSalesOfToday,
  getSalesByDay,
  getSalesByRange,
};
