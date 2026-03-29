const { query } = require('../../database/pg/pool');

const CATEGORY_SELECT_FIELDS = `
  id,
  name,
  category_type,
  description,
  is_active,
  created_at,
  updated_at
`;

const createCategory = async ({ name, category_type, description }) => {
  const sql = `
    INSERT INTO categories (
      name,
      category_type,
      description
    )
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  const result = await query(sql, [name, category_type, description]);
  return result.rows[0];
};

const findCategoryById = async (id) => {
  const sql = `
    SELECT ${CATEGORY_SELECT_FIELDS}
    FROM categories
    WHERE id = $1
    LIMIT 1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

const findCategoryByName = async (name) => {
  const sql = `
    SELECT ${CATEGORY_SELECT_FIELDS}
    FROM categories
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;

  const result = await query(sql, [name]);
  return result.rows[0] || null;
};

const updateCategory = async ({ id, name, category_type, description }) => {
  const sql = `
    UPDATE categories
    SET
      name = COALESCE($2, name),
      category_type = COALESCE($3, category_type),
      description = COALESCE($4, description)
    WHERE id = $1
    RETURNING id
  `;

  const result = await query(sql, [id, name, category_type, description]);
  return result.rows[0] || null;
};

const updateCategoryStatus = async ({ id, is_active }) => {
  const sql = `
    UPDATE categories
    SET is_active = $2
    WHERE id = $1
    RETURNING id
  `;

  const result = await query(sql, [id, is_active]);
  return result.rows[0] || null;
};

const listCategories = async ({ limit, offset, is_active, category_type }) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (typeof is_active === 'boolean') {
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (category_type) {
    conditions.push(`category_type = $${paramIndex++}`);
    values.push(category_type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ${CATEGORY_SELECT_FIELDS}
    FROM categories
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  values.push(limit, offset);

  const result = await query(sql, values);
  return result.rows;
};

const countCategories = async ({ is_active, category_type }) => {
  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (typeof is_active === 'boolean') {
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(is_active);
  }

  if (category_type) {
    conditions.push(`category_type = $${paramIndex++}`);
    values.push(category_type);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM categories
    ${whereClause}
  `;

  const result = await query(sql, values);
  return result.rows[0].total;
};

module.exports = {
  createCategory,
  findCategoryById,
  findCategoryByName,
  updateCategory,
  updateCategoryStatus,
  listCategories,
  countCategories,
};