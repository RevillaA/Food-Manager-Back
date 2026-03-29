const { query } = require('../../database/pg/pool');

const DAILY_SESSION_SELECT_FIELDS = `
  ds.id,
  ds.session_date,
  ds.status,
  ds.opened_at,
  ds.closed_at,
  ds.notes,
  ds.created_at,
  ds.updated_at,
  ds.opened_by_user_id,
  opener.full_name AS opened_by_full_name,
  opener.username AS opened_by_username,
  ds.closed_by_user_id,
  closer.full_name AS closed_by_full_name,
  closer.username AS closed_by_username
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

const createDailySession = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { session_date, opened_by_user_id, notes } = payload;

  const sql = `
    INSERT INTO daily_sessions (
      session_date,
      opened_by_user_id,
      notes
    )
    VALUES ($1, $2, $3)
    RETURNING id
  `;

  const result = await exec(sql, [session_date, opened_by_user_id, notes]);
  return result.rows[0];
};

const findDailySessionById = async (clientOrId, maybeId) => {
  const { client, value: id } = normalizeArgs(clientOrId, maybeId);
  const exec = getExecutor(client);

  const sql = `
    SELECT ${DAILY_SESSION_SELECT_FIELDS}
    FROM daily_sessions ds
    INNER JOIN users opener ON opener.id = ds.opened_by_user_id
    LEFT JOIN users closer ON closer.id = ds.closed_by_user_id
    WHERE ds.id = $1
    LIMIT 1
  `;

  const result = await exec(sql, [id]);
  return result.rows[0] || null;
};

const findDailySessionByDate = async (clientOrDate, maybeDate) => {
  const { client, value: session_date } = normalizeArgs(clientOrDate, maybeDate);
  const exec = getExecutor(client);

  const sql = `
    SELECT ${DAILY_SESSION_SELECT_FIELDS}
    FROM daily_sessions ds
    INNER JOIN users opener ON opener.id = ds.opened_by_user_id
    LEFT JOIN users closer ON closer.id = ds.closed_by_user_id
    WHERE ds.session_date = $1
    LIMIT 1
  `;

  const result = await exec(sql, [session_date]);
  return result.rows[0] || null;
};

const findActiveDailySession = async (client = null) => {
  const exec = getExecutor(client);

  const sql = `
    SELECT ${DAILY_SESSION_SELECT_FIELDS}
    FROM daily_sessions ds
    INNER JOIN users opener ON opener.id = ds.opened_by_user_id
    LEFT JOIN users closer ON closer.id = ds.closed_by_user_id
    WHERE ds.status = 'OPEN'
    ORDER BY ds.session_date DESC
    LIMIT 1
  `;

  const result = await exec(sql);
  return result.rows[0] || null;
};

const closeDailySession = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { id, closed_by_user_id, notes } = payload;

  const sql = `
    UPDATE daily_sessions
    SET
      status = 'CLOSED',
      closed_by_user_id = $2,
      closed_at = NOW(),
      notes = COALESCE($3, notes)
    WHERE id = $1
    RETURNING id
  `;

  const result = await exec(sql, [id, closed_by_user_id, notes]);
  return result.rows[0] || null;
};

const updateDailySessionStatus = async (clientOrPayload, maybePayload) => {
  const client = isClient(clientOrPayload) ? clientOrPayload : null;
  const payload = isClient(clientOrPayload) ? maybePayload : clientOrPayload;
  const exec = getExecutor(client);

  const { id, status, admin_user_id } = payload;

  let sql = '';
  let params = [];

  if (status === 'OPEN') {
    sql = `
      UPDATE daily_sessions
      SET
        status = 'OPEN',
        closed_at = NULL,
        closed_by_user_id = NULL
      WHERE id = $1
      RETURNING id
    `;
    params = [id];
  }

  if (status === 'CLOSED') {
    sql = `
      UPDATE daily_sessions
      SET
        status = 'CLOSED',
        closed_at = NOW(),
        closed_by_user_id = $2
      WHERE id = $1
      RETURNING id
    `;
    params = [id, admin_user_id];
  }

  const result = await exec(sql, params);
  return result.rows[0] || null;
};

const listDailySessions = async (clientOrFilters, maybeFilters) => {
  const client = isClient(clientOrFilters) ? clientOrFilters : null;
  const filters = isClient(clientOrFilters) ? maybeFilters : clientOrFilters;
  const exec = getExecutor(client);

  const { limit, offset, status, session_date } = filters;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`ds.status = $${paramIndex++}`);
    values.push(status);
  }

  if (session_date) {
    conditions.push(`ds.session_date = $${paramIndex++}`);
    values.push(session_date);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT ${DAILY_SESSION_SELECT_FIELDS}
    FROM daily_sessions ds
    INNER JOIN users opener ON opener.id = ds.opened_by_user_id
    LEFT JOIN users closer ON closer.id = ds.closed_by_user_id
    ${whereClause}
    ORDER BY ds.session_date DESC, ds.created_at DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;

  values.push(limit, offset);

  const result = await exec(sql, values);
  return result.rows;
};

const countDailySessions = async (clientOrFilters, maybeFilters) => {
  const client = isClient(clientOrFilters) ? clientOrFilters : null;
  const filters = isClient(clientOrFilters) ? maybeFilters : clientOrFilters;
  const exec = getExecutor(client);

  const { status, session_date } = filters;

  const conditions = [];
  const values = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (session_date) {
    conditions.push(`session_date = $${paramIndex++}`);
    values.push(session_date);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT COUNT(*)::int AS total
    FROM daily_sessions
    ${whereClause}
  `;

  const result = await exec(sql, values);
  return result.rows[0].total;
};

module.exports = {
  createDailySession,
  findDailySessionById,
  findDailySessionByDate,
  findActiveDailySession,
  closeDailySession,
  updateDailySessionStatus,
  listDailySessions,
  countDailySessions,
};