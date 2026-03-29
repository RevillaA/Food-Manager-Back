const ConflictError = require('../../common/errors/conflict-error');
const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const { getPagination } = require('../../common/utils/pagination.util');
const { getTodayDateString } = require('../../common/utils/date.util');

const dailySessionsRepository = require('./daily-sessions.repository');

const openDailySession = async (payload, authenticatedUser) => {
  const targetDate = payload.session_date || getTodayDateString();

  const existingSessionForDate = await dailySessionsRepository.findDailySessionByDate(targetDate);

  if (existingSessionForDate) {
    throw new ConflictError('A daily session already exists for this date');
  }

  const created = await dailySessionsRepository.createDailySession({
    session_date: targetDate,
    opened_by_user_id: authenticatedUser.id,
    notes: payload.notes || null,
  });

  return dailySessionsRepository.findDailySessionById(created.id);
};

const getActiveDailySession = async () => {
  const activeSession = await dailySessionsRepository.findActiveDailySession();

  if (!activeSession) {
    throw new NotFoundError('No active daily session found');
  }

  return activeSession;
};

const getDailySessions = async (queryParams) => {
  const { page, limit, offset } = getPagination(queryParams);

  const filters = {
    status: queryParams.status || undefined,
    session_date: queryParams.session_date || undefined,
  };

  const [dailySessions, total] = await Promise.all([
    dailySessionsRepository.listDailySessions({
      limit,
      offset,
      ...filters,
    }),
    dailySessionsRepository.countDailySessions(filters),
  ]);

  return {
    data: dailySessions,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getDailySessionById = async (id) => {
  const dailySession = await dailySessionsRepository.findDailySessionById(id);

  if (!dailySession) {
    throw new NotFoundError('Daily session not found');
  }

  return dailySession;
};

const closeDailySession = async (id, payload, authenticatedUser) => {
  const currentSession = await dailySessionsRepository.findDailySessionById(id);

  if (!currentSession) {
    throw new NotFoundError('Daily session not found');
  }

  if (currentSession.status === 'CLOSED') {
    throw new BadRequestError('Daily session is already closed');
  }

  await dailySessionsRepository.closeDailySession({
    id,
    closed_by_user_id: authenticatedUser.id,
    notes: payload.notes ?? null,
  });

  return dailySessionsRepository.findDailySessionById(id);
};

const updateDailySessionStatus = async (id, payload, authenticatedUser) => {
  const currentSession = await dailySessionsRepository.findDailySessionById(id);

  if (!currentSession) {
    throw new NotFoundError('Daily session not found');
  }

  if (payload.status === currentSession.status) {
    throw new BadRequestError(`Daily session is already ${payload.status}`);
  }

  if (payload.status === 'OPEN') {
    const activeSession = await dailySessionsRepository.findActiveDailySession();

    if (activeSession && activeSession.id !== id) {
      throw new ConflictError(
        'Another active daily session already exists. Close it before reopening this one'
      );
    }
  }

  await dailySessionsRepository.updateDailySessionStatus({
    id,
    status: payload.status,
    admin_user_id: authenticatedUser.id,
  });

  return dailySessionsRepository.findDailySessionById(id);
};

module.exports = {
  openDailySession,
  getActiveDailySession,
  getDailySessions,
  getDailySessionById,
  closeDailySession,
  updateDailySessionStatus,
};