const toDailySalesReportResponse = ({
  date,
  total_sales_amount,
  total_sales_count,
  totals_by_category,
  sales,
}) => {
  return {
    date,
    total_sales_amount: Number(total_sales_amount || 0),
    total_sales_count: Number(total_sales_count || 0),
    totals_by_category: {
      MAIN_DISH: Number(totals_by_category.MAIN_DISH || 0),
      DRINK: Number(totals_by_category.DRINK || 0),
      EXTRA: Number(totals_by_category.EXTRA || 0),
      SWEET: Number(totals_by_category.SWEET || 0),
    },
    sales: sales.map((sale) => ({
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
    })),
  };
};

const toSalesRangeReportResponse = ({ summary, sales }) => {
  return {
    summary: {
      date_from: summary.date_from,
      date_to: summary.date_to,
      total_sales_amount: Number(summary.total_sales_amount || 0),
      total_sales_count: Number(summary.total_sales_count || 0),
    },
    sales: sales.map((sale) => ({
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
    })),
  };
};

const toTopProductsReportResponse = (products = []) => {
  return products.map((product) => ({
    product_name: product.product_name,
    product_category_name: product.product_category_name,
    total_quantity_sold: Number(product.total_quantity_sold || 0),
    total_amount: Number(product.total_amount || 0),
  }));
};

const toCategorySummaryReportResponse = ({ date_from, date_to, categories }) => {
  return {
    date_from,
    date_to,
    categories: categories.map((category) => ({
      category_name: category.product_category_name,
      total_amount: Number(category.total_amount || 0),
      total_quantity: Number(category.total_quantity || 0),
    })),
  };
};

module.exports = {
  toDailySalesReportResponse,
  toSalesRangeReportResponse,
  toTopProductsReportResponse,
  toCategorySummaryReportResponse,
};