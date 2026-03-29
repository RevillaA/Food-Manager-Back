const ORDER_SELECT_FIELDS = `
  o.id,
  o.daily_session_id,
  o.created_by_user_id,
  o.order_number,
  o.status,
  o.preparation_status,
  o.subtotal,
  o.notes,
  o.closed_at,
  o.cancelled_at,
  o.created_at,
  o.updated_at,
  u.full_name AS created_by_full_name,
  u.username AS created_by_username
`;

const findOrderById = async (client, id) => {
  const sql = `
    SELECT ${ORDER_SELECT_FIELDS}
    FROM orders o
    INNER JOIN users u ON u.id = o.created_by_user_id
    WHERE o.id = $1
    LIMIT 1
  `;

  const result = await client.query(sql, [id]);
  return result.rows[0] || null;
};

const listOrders = async (client, { limit, offset, status, preparation_status, daily_session_id }) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`o.status = $${paramIndex++}`);
    values.push(status);
  }

  if (preparation_status) {
    conditions.push(`o.preparation_status = $${paramIndex++}`);
    values.push(preparation_status);
  }

  if (daily_session_id) {
    conditions.push(`o.daily_session_id = $${paramIndex++}`);
    values.push(daily_session_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ${ORDER_SELECT_FIELDS}
    FROM orders o
    INNER JOIN users u ON u.id = o.created_by_user_id
    ${whereClause}
    ORDER BY o.order_number ASC, o.created_at ASC 
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  values.push(limit, offset);

  const result = await client.query(sql, values);
  return result.rows;
};

const countOrders = async (client, { status, preparation_status, daily_session_id }) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (preparation_status) {
    conditions.push(`preparation_status = $${paramIndex++}`);
    values.push(preparation_status);
  }

  if (daily_session_id) {
    conditions.push(`daily_session_id = $${paramIndex++}`);
    values.push(daily_session_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM orders
    ${whereClause}
  `;

  const result = await client.query(sql, values);
  return result.rows[0].total;
};

const getNextOrderNumber = async (client, daily_session_id) => {
  const sql = `
    SELECT COALESCE(MAX(order_number), 0)::int + 1 AS next_order_number
    FROM orders
    WHERE daily_session_id = $1
  `;

  const result = await client.query(sql, [daily_session_id]);
  return result.rows[0].next_order_number;
};

const createOrder = async (client, { daily_session_id, created_by_user_id, order_number, notes }) => {
  const sql = `
    INSERT INTO orders (
      daily_session_id,
      created_by_user_id,
      order_number,
      notes
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await client.query(sql, [
    daily_session_id,
    created_by_user_id,
    order_number,
    notes,
  ]);

  return result.rows[0];
};

const updateOrderPreparationStatus = async (client, { id, preparation_status }) => {
  const sql = `
    UPDATE orders
    SET preparation_status = $2
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [id, preparation_status]);
  return result.rows[0] || null;
};

const cancelOrder = async (client, { id, notes }) => {
  const sql = `
    UPDATE orders
    SET
      status = 'CANCELLED',
      cancelled_at = NOW(),
      notes = COALESCE($2, notes)
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [id, notes]);
  return result.rows[0] || null;
};

const closeOrder = async (client, { id, notes }) => {
  const sql = `
    UPDATE orders
    SET
      status = 'CLOSED',
      closed_at = NOW(),
      notes = COALESCE($2, notes)
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [id, notes]);
  return result.rows[0] || null;
};

module.exports = {
  findOrderById,
  listOrders,
  countOrders,
  getNextOrderNumber,
  createOrder,
  updateOrderPreparationStatus,
  cancelOrder,
  closeOrder,
};