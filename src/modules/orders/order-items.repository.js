const ORDER_ITEM_SELECT_FIELDS = `
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.product_name,
  oi.product_category_name,
  oi.quantity,
  oi.unit_price,
  oi.line_total,
  oi.preparation_status,
  oi.notes,
  oi.created_at,
  oi.updated_at
`;

const listOrderItemsByOrderId = async (client, order_id) => {
  const sql = `
    SELECT ${ORDER_ITEM_SELECT_FIELDS}
    FROM order_items oi
    WHERE oi.order_id = $1
    ORDER BY oi.created_at ASC
  `;

  const result = await client.query(sql, [order_id]);
  return result.rows;
};

const findOrderItemById = async (client, itemId) => {
  const sql = `
    SELECT ${ORDER_ITEM_SELECT_FIELDS}
    FROM order_items oi
    WHERE oi.id = $1
    LIMIT 1
  `;

  const result = await client.query(sql, [itemId]);
  return result.rows[0] || null;
};

const createOrderItem = async (
  client,
  {
    order_id,
    product_id,
    product_name,
    product_category_name,
    quantity,
    unit_price,
    line_total,
    notes,
  }
) => {
  const sql = `
    INSERT INTO order_items (
      order_id,
      product_id,
      product_name,
      product_category_name,
      quantity,
      unit_price,
      line_total,
      notes
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id
  `;

  const result = await client.query(sql, [
    order_id,
    product_id,
    product_name,
    product_category_name,
    quantity,
    unit_price,
    line_total,
    notes,
  ]);

  return result.rows[0];
};

const updateOrderItem = async (client, { itemId, quantity, line_total, notes }) => {
  const sql = `
    UPDATE order_items
    SET
      quantity = COALESCE($2, quantity),
      line_total = COALESCE($3, line_total),
      notes = COALESCE($4, notes)
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [itemId, quantity, line_total, notes]);
  return result.rows[0] || null;
};

const updateOrderItemPreparationStatus = async (client, { itemId, preparation_status }) => {
  const sql = `
    UPDATE order_items
    SET preparation_status = $2
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [itemId, preparation_status]);
  return result.rows[0] || null;
};

const deleteOrderItem = async (client, itemId) => {
  const sql = `
    DELETE FROM order_items
    WHERE id = $1
    RETURNING id
  `;

  const result = await client.query(sql, [itemId]);
  return result.rows[0] || null;
};

const calculateOrderPreparationStatus = async (client, order_id) => {
  const sql = `
    SELECT
      CASE
        WHEN COUNT(*) = 0 THEN 'IN_PROGRESS'
        WHEN BOOL_AND(preparation_status = 'SERVED') THEN 'SERVED'
        ELSE 'IN_PROGRESS'
      END AS preparation_status
    FROM order_items
    WHERE order_id = $1
  `;

  const result = await client.query(sql, [order_id]);
  return result.rows[0].preparation_status;
};

module.exports = {
  listOrderItemsByOrderId,
  findOrderItemById,
  createOrderItem,
  updateOrderItem,
  updateOrderItemPreparationStatus,
  deleteOrderItem,
  calculateOrderPreparationStatus,
};