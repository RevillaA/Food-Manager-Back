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

const findSaleById = async (client, id) => {
  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    WHERE s.id = $1
    LIMIT 1
  `;

  const result = await client.query(sql, [id]);
  return result.rows[0] || null;
};

const findSaleByOrderId = async (client, order_id) => {
  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    WHERE s.order_id = $1
    LIMIT 1
  `;

  const result = await client.query(sql, [order_id]);
  return result.rows[0] || null;
};

const getNextSaleNumber = async (client, daily_session_id) => {
  const sql = `
    SELECT COALESCE(MAX(sale_number), 0)::int + 1 AS next_sale_number
    FROM sales
    WHERE daily_session_id = $1
  `;

  const result = await client.query(sql, [daily_session_id]);
  return result.rows[0].next_sale_number;
};

const createSale = async (
  client,
  {
    daily_session_id,
    order_id,
    created_by_user_id,
    sale_number,
    payment_status,
    payment_method,
    subtotal,
    total,
    paid_at,
    notes,
  }
) => {
  const sql = `
    INSERT INTO sales (
      daily_session_id,
      order_id,
      created_by_user_id,
      sale_number,
      payment_status,
      payment_method,
      subtotal,
      total,
      paid_at,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `;

  const result = await client.query(sql, [
    daily_session_id,
    order_id,
    created_by_user_id,
    sale_number,
    payment_status,
    payment_method,
    subtotal,
    total,
    paid_at,
    notes,
  ]);

  return result.rows[0];
};

const listSales = async (
  client,
  { limit, offset, daily_session_id, payment_status, payment_method, date_from, date_to }
) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (daily_session_id) {
    conditions.push(`s.daily_session_id = $${paramIndex++}`);
    values.push(daily_session_id);
  }

  if (payment_status) {
    conditions.push(`s.payment_status = $${paramIndex++}`);
    values.push(payment_status);
  }

  if (payment_method) {
    conditions.push(`s.payment_method = $${paramIndex++}`);
    values.push(payment_method);
  }

  if (date_from) {
    conditions.push(`s.created_at::date >= $${paramIndex++}`);
    values.push(date_from);
  }

  if (date_to) {
    conditions.push(`s.created_at::date <= $${paramIndex++}`);
    values.push(date_to);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    ${whereClause}
    ORDER BY s.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  values.push(limit, offset);

  const result = await client.query(sql, values);
  return result.rows;
};

const countSales = async (
  client,
  { daily_session_id, payment_status, payment_method, date_from, date_to }
) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (daily_session_id) {
    conditions.push(`daily_session_id = $${paramIndex++}`);
    values.push(daily_session_id);
  }

  if (payment_status) {
    conditions.push(`payment_status = $${paramIndex++}`);
    values.push(payment_status);
  }

  if (payment_method) {
    conditions.push(`payment_method = $${paramIndex++}`);
    values.push(payment_method);
  }

  if (date_from) {
    conditions.push(`created_at::date >= $${paramIndex++}`);
    values.push(date_from);
  }

  if (date_to) {
    conditions.push(`created_at::date <= $${paramIndex++}`);
    values.push(date_to);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM sales
    ${whereClause}
  `;

  const result = await client.query(sql, values);
  return result.rows[0].total;
};
const listSalesOfDay = async (client, session_date) => {
  const sql = `
    SELECT ${SALES_SELECT_FIELDS}
    FROM sales s
    INNER JOIN users u ON u.id = s.created_by_user_id
    INNER JOIN daily_sessions ds ON ds.id = s.daily_session_id
    WHERE ds.session_date = $1
    ORDER BY s.sale_number ASC
  `;

  const result = await client.query(sql, [session_date]);
  return result.rows;
};

module.exports = {
  findSaleById,
  findSaleByOrderId,
  getNextSaleNumber,
  createSale,
  listSales,
  countSales,
  listSalesOfDay,
};