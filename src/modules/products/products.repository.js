const { query } = require('../../database/pg/pool');

const PRODUCT_SELECT_FIELDS = `
  p.id,
  p.name,
  p.description,
  p.base_price,
  p.is_active,
  p.created_at,
  p.updated_at,
  c.id AS category_id,
  c.name AS category_name,
  c.category_type,
  c.is_active AS category_is_active
`;

const isClient = (value) => value && typeof value.query === 'function';

const getExecutor = (client) => {
  return isClient(client) ? client.query.bind(client) : query;
};

const normalizeArgs = (clientOrValue, value) => {
  if (isClient(clientOrValue)) {
    return { client: clientOrValue, value };
  }

  return { client: null, value: clientOrValue };
};

const normalizeArgsTwoValues = (clientOrFirst, firstOrSecond, second) => {
  if (isClient(clientOrFirst)) {
    return { client: clientOrFirst, first: firstOrSecond, second };
  }

  return { client: null, first: clientOrFirst, second: firstOrSecond };
};

const createProduct = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { category_id, name, description, base_price } = payload;

  const sql = `
    INSERT INTO products (
      category_id,
      name,
      description,
      base_price
    )
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await exec(sql, [category_id, name, description, base_price]);
  return result.rows[0];
};

const findProductById = async (clientOrId, maybeId) => {
  const { client, value: id } = normalizeArgs(clientOrId, maybeId);
  const exec = getExecutor(client);

  const sql = `
    SELECT ${PRODUCT_SELECT_FIELDS}
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    WHERE p.id = $1
    LIMIT 1
  `;

  const result = await exec(sql, [id]);
  return result.rows[0] || null;
};

const findProductByCategoryAndName = async (clientOrCategoryId, maybeCategoryId, maybeName) => {
  const { client, first: category_id, second: name } = normalizeArgsTwoValues(
    clientOrCategoryId,
    maybeCategoryId,
    maybeName
  );
  const exec = getExecutor(client);

  const sql = `
    SELECT ${PRODUCT_SELECT_FIELDS}
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    WHERE p.category_id = $1
      AND LOWER(p.name) = LOWER($2)
    LIMIT 1
  `;

  const result = await exec(sql, [category_id, name]);
  return result.rows[0] || null;
};

const updateProduct = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { id, category_id, name, description, base_price } = payload;

  const sql = `
    UPDATE products
    SET
      category_id = COALESCE($2, category_id),
      name = COALESCE($3, name),
      description = COALESCE($4, description),
      base_price = COALESCE($5, base_price)
    WHERE id = $1
    RETURNING id
  `;

  const result = await exec(sql, [id, category_id, name, description, base_price]);
  return result.rows[0] || null;
};

const updateProductStatus = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { id, is_active } = payload;

  const sql = `
    UPDATE products
    SET is_active = $2
    WHERE id = $1
    RETURNING id
  `;

  const result = await exec(sql, [id, is_active]);
  return result.rows[0] || null;
};

const listProducts = async (clientOrFilters, maybeFilters) => {
  const client = isClient(clientOrFilters) ? clientOrFilters : null;
  const filters = isClient(clientOrFilters) ? maybeFilters : clientOrFilters;
  const exec = getExecutor(client);

  const { limit, offset, is_active, category_id } = filters;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (typeof is_active === 'boolean') {
    conditions.push(`p.is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (category_id) {
    conditions.push(`p.category_id = $${paramIndex++}`);
    values.push(category_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ${PRODUCT_SELECT_FIELDS}
    FROM products p
    INNER JOIN categories c ON c.id = p.category_id
    ${whereClause}
    ORDER BY p.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  values.push(limit, offset);

  const result = await exec(sql, values);
  return result.rows;
};

const countProducts = async (clientOrFilters, maybeFilters) => {
  const client = isClient(clientOrFilters) ? clientOrFilters : null;
  const filters = isClient(clientOrFilters) ? maybeFilters : clientOrFilters;
  const exec = getExecutor(client);

  const { is_active, category_id } = filters;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (typeof is_active === 'boolean') {
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (category_id) {
    conditions.push(`category_id = $${paramIndex++}`);
    values.push(category_id);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM products
    ${whereClause}
  `;

  const result = await exec(sql, values);
  return result.rows[0].total;
};

module.exports = {
  createProduct,
  findProductById,
  findProductByCategoryAndName,
  updateProduct,
  updateProductStatus,
  listProducts,
  countProducts,
};