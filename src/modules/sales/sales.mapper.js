const toSaleItemResponse = (item) => {
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
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
};

const toSaleResponse = (sale) => {
  if (!sale) {
    return null;
  }

  return {
    id: sale.id,
    daily_session_id: sale.daily_session_id,
    order_id: sale.order_id,
    created_by_user_id: sale.created_by_user_id,
    sale_number: sale.sale_number,
    payment_status: sale.payment_status,
    payment_method: sale.payment_method,
    subtotal: Number(sale.subtotal),
    total: Number(sale.total),
    paid_at: sale.paid_at,
    notes: sale.notes,
    created_at: sale.created_at,
    updated_at: sale.updated_at,
    created_by_user: {
      id: sale.created_by_user_id,
      full_name: sale.created_by_full_name,
      username: sale.created_by_username,
    },
  };
};

const toSaleDetailResponse = (sale, items = []) => {
  const baseSale = toSaleResponse(sale);

  return {
    ...baseSale,
    items: items.map(toSaleItemResponse),
  };
};

const toSalesListResponse = (sales = []) => {
  return sales.map(toSaleResponse);
};

module.exports = {
  toSaleItemResponse,
  toSaleResponse,
  toSaleDetailResponse,
  toSalesListResponse,
};