const toOrderItemResponse = (item) => {
  if (!item) {
    return null;
  }

  return {
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    product_category_name: item.product_category_name,
    quantity: item.quantity,
    unit_price: Number(item.unit_price),
    line_total: Number(item.line_total),
    preparation_status: item.preparation_status,
    notes: item.notes,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const toOrderResponse = (order) => {
  if (!order) {
    return null;
  }

  return {
    id: order.id,
    daily_session_id: order.daily_session_id,
    created_by_user_id: order.created_by_user_id,
    order_number: order.order_number,
    status: order.status,
    preparation_status: order.preparation_status,
    subtotal: Number(order.subtotal),
    notes: order.notes,
    closed_at: order.closed_at,
    cancelled_at: order.cancelled_at,
    created_at: order.created_at,
    updated_at: order.updated_at,
    ...(order.payment_state ? { payment_state: order.payment_state } : {}),
    created_by_user: {
      id: order.created_by_user_id,
      full_name: order.created_by_full_name,
      username: order.created_by_username,
    },
  };
};

const toOrderDetailResponse = (order, items = []) => {
  const baseOrder = toOrderResponse(order);

  return {
    ...baseOrder,
    items: items.map(toOrderItemResponse),
  };
};

const toOrdersListResponse = (orders = []) => {
  return orders.map(toOrderResponse);
};

module.exports = {
  toOrderItemResponse,
  toOrderResponse,
  toOrderDetailResponse,
  toOrdersListResponse,
};