const SALE_ITEM_SELECT_FIELDS = `
  si.id,
  si.sale_id,
  si.product_id,
  si.product_name,
  si.product_category_name,
  si.quantity,
  si.unit_price,
  si.line_total,
  si.created_at,
  si.updated_at
`;

const listSaleItemsBySaleId = async (client, sale_id) => {
  const sql = `
    SELECT ${SALE_ITEM_SELECT_FIELDS}
    FROM sale_items si
    WHERE si.sale_id = $1
    ORDER BY si.created_at ASC
  `;

  const result = await client.query(sql, [sale_id]);
  return result.rows;
};

const createSaleItem = async (
  client,
  {
    sale_id,
    product_id,
    product_name,
    product_category_name,
    quantity,
    unit_price,
    line_total,
  }
) => {
  const sql = `
    INSERT INTO sale_items (
      sale_id,
      product_id,
      product_name,
      product_category_name,
      quantity,
      unit_price,
      line_total
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;

  const result = await client.query(sql, [
    sale_id,
    product_id,
    product_name,
    product_category_name,
    quantity,
    unit_price,
    line_total,
  ]);

  return result.rows[0];
};

module.exports = {
  listSaleItemsBySaleId,
  createSaleItem,
};