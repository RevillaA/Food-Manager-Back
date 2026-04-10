const SALES_SELECT_FIELDS = `
  s.id,
  s.daily_session_id,
  s.order_id,
  s.created_by_user_id,
  s.sale_number,
  s.payment_status,
  s.payment_method,
  s.subtotal,
  s.total,
  s.paid_at,
  s.notes,
  s.created_at,
  s.updated_at,
  u.full_name AS created_by_full_name,
  u.username AS created_by_username
`;

const getDailySalesSummary = async (client, date) => {
  const sql = `
    SELECT
      COALESCE(SUM(total), 0)::numeric(10,2) AS total_sales_amount,
      COUNT(*)::int AS total_sales_count
    FROM sales s
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date = $1
  `;

  const result = await client.query(sql, [date]);
  return result.rows[0];
};

const listDailySales = async (client, date) => {
  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date = $1
    ORDER BY s.sale_number ASC
  `;

  const result = await client.query(sql, [date]);
  return result.rows;
};

const getDailyCategoryTotals = async (client, date) => {
  const sql = `
    SELECT
      CASE
        WHEN LOWER(si.product_category_name) = 'platos' THEN 'MAIN_DISH'
        WHEN LOWER(si.product_category_name) = 'bebidas' THEN 'DRINK'
        WHEN LOWER(si.product_category_name) = 'extras' THEN 'EXTRA'
        WHEN LOWER(si.product_category_name) = 'sweet' THEN 'SWEET'
        WHEN LOWER(si.product_category_name) = 'postres' THEN 'SWEET'
        ELSE si.product_category_name
      END AS category_key,
      COALESCE(SUM(si.line_total), 0)::numeric(10,2) AS total_amount
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date = $1
    GROUP BY category_key
  `;

  const result = await client.query(sql, [date]);
  return result.rows;
};

const getSalesRangeSummary = async (client, date_from, date_to) => {
  const sql = `
    SELECT
      COALESCE(SUM(total), 0)::numeric(10,2) AS total_sales_amount,
      COUNT(*)::int AS total_sales_count
    FROM sales s
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date >= $1
      AND ds.session_date <= $2
  `;

  const result = await client.query(sql, [date_from, date_to]);
  return result.rows[0];
};

const listSalesRange = async (client, { date_from, date_to, limit, offset }) => {
  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date >= $1
      AND ds.session_date <= $2
    ORDER BY ds.session_date DESC, s.sale_number ASC
    LIMIT $3 OFFSET $4
  `;

  const result = await client.query(sql, [date_from, date_to, limit, offset]);
  return result.rows;
};

const countSalesRange = async (client, { date_from, date_to }) => {
  const sql = `
    SELECT COUNT(*)::int AS total
    FROM sales s
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date >= $1
      AND ds.session_date <= $2
  `;

  const result = await client.query(sql, [date_from, date_to]);
  return result.rows[0].total;
};

const getTopSellingProducts = async (client, { date_from, date_to, limit }) => {
  const sql = `
    SELECT
      si.product_name,
      si.product_category_name,
      SUM(si.quantity)::int AS total_quantity_sold,
      COALESCE(SUM(si.line_total), 0)::numeric(10,2) AS total_amount
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date >= $1
      AND ds.session_date <= $2
    GROUP BY si.product_name, si.product_category_name
    ORDER BY total_quantity_sold DESC, total_amount DESC
    LIMIT $3
  `;

  const result = await client.query(sql, [date_from, date_to, limit]);
  return result.rows;
};

const getCategorySummary = async (client, { date_from, date_to }) => {
  const sql = `
    SELECT
      si.product_category_name,
      SUM(si.quantity)::int AS total_quantity,
      COALESCE(SUM(si.line_total), 0)::numeric(10,2) AS total_amount
    FROM sale_items si
    INNER JOIN sales s ON s.id = si.sale_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date >= $1
      AND ds.session_date <= $2
    GROUP BY si.product_category_name
    ORDER BY total_amount DESC
  `;

  const result = await client.query(sql, [date_from, date_to]);
  return result.rows;
};

module.exports = {
  getDailySalesSummary,
  listDailySales,
  getDailyCategoryTotals,
  getSalesRangeSummary,
  listSalesRange,
  countSalesRange,
  getTopSellingProducts,
  getCategorySummary,
};
