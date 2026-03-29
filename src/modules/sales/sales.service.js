const { pool } = require('../../database/pg/pool');
const { withTransaction } = require('../../database/pg/transaction');

const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const ConflictError = require('../../common/errors/conflict-error');
const { getPagination } = require('../../common/utils/pagination.util');
const { getTodayDateString } = require('../../common/utils/date.util');

const salesRepository = require('./sales.repository');
const saleItemsRepository = require('./sale-items.repository');
const ordersRepository = require('../orders/orders.repository');
const orderItemsRepository = require('../orders/order-items.repository');

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

    const sale_number = await salesRepository.getNextSaleNumber(client, order.daily_session_id);

    const paid_at = payload.payment_status === 'PAID' ? new Date().toISOString() : null;

    const createdSale = await salesRepository.createSale(client, {
      daily_session_id: order.daily_session_id,
      order_id: order.id,
      created_by_user_id: authenticatedUser.id,
      sale_number,
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

    return {
      data: sales,
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
  const client = await pool.connect();

  try {
    const today = getTodayDateString();
    return salesRepository.listSalesOfDay(client, today);
  } finally {
    client.release();
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  getSalesOfToday,
};