const { query } = require('../../database/pg/pool');

const USER_SELECT_FIELDS = `
  u.id,
  u.full_name,
  u.username,
  u.email,
  u.is_active,
  u.created_at,
  u.updated_at,
  r.id AS role_id,
  r.name AS role_name,
  r.description AS role_description
`;

const findRoleByName = async (roleName) => {
  const sql = `
    SELECT id, name, description
    FROM roles
    WHERE name = $1
    LIMIT 1
  `;

  const result = await query(sql, [roleName]);
  return result.rows[0] || null;
};

const findUserById = async (id) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    LIMIT 1
  `;

  const result = await query(sql, [id]);
  return result.rows[0] || null;
};

const findUserWithPasswordByUsername = async (username) => {
  const sql = `
    SELECT
      u.id,
      u.full_name,
      u.username,
      u.email,
      u.password_hash,
      u.is_active,
      u.created_at,
      u.updated_at,
      r.id AS role_id,
      r.name AS role_name,
      r.description AS role_description
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.username = $1
    LIMIT 1
  `;

  const result = await query(sql, [username]);
  return result.rows[0] || null;
};

const findUserByUsername = async (username) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.username = $1
    LIMIT 1
  `;

  const result = await query(sql, [username]);
  return result.rows[0] || null;
};

const findUserByEmail = async (email) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    WHERE u.email = $1
    LIMIT 1
  `;

  const result = await query(sql, [email]);
  return result.rows[0] || null;
};

const createUser = async ({ full_name, username, email, password_hash, role_id }) => {
  const sql = `
    INSERT INTO users (
      role_id,
      full_name,
      username,
      email,
      password_hash
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const result = await query(sql, [
    role_id,
    full_name,
    username,
    email,
    password_hash,
  ]);

  return result.rows[0];
};

const updateUser = async ({ id, full_name, username, email, role_id }) => {
  const sql = `
    UPDATE users
    SET
      full_name = COALESCE($2, full_name),
      username = COALESCE($3, username),
      email = COALESCE($4, email),
      role_id = COALESCE($5, role_id)
    WHERE id = $1
    RETURNING id
  `;

  const result = await query(sql, [id, full_name, username, email, role_id]);
  return result.rows[0] || null;
};

const updateUserStatus = async ({ id, is_active }) => {
  const sql = `
    UPDATE users
    SET is_active = $2
    WHERE id = $1
    RETURNING id
  `;

  const result = await query(sql, [id, is_active]);
  return result.rows[0] || null;
};

const listUsers = async ({ limit, offset }) => {
  const sql = `
    SELECT ${USER_SELECT_FIELDS}
    FROM users u
    INNER JOIN roles r ON r.id = u.role_id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
  `;

  const result = await query(sql, [limit, offset]);
  return result.rows;
};

const countUsers = async () => {
  const sql = `SELECT COUNT(*)::int AS total FROM users`;
  const result = await query(sql);
  return result.rows[0].total;
};

module.exports = {
  findRoleByName,
  findUserById,
  findUserWithPasswordByUsername,
  findUserByUsername,
  findUserByEmail,
  createUser,
  updateUser,
  updateUserStatus,
  listUsers,
  countUsers,
};