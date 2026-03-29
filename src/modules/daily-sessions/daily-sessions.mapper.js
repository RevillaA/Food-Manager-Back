const toDailySessionResponse = (dailySession) => {
  if (!dailySession) {
    return null;
  }

  return {
    id: dailySession.id,
    session_date: dailySession.session_date,
    status: dailySession.status,
    opened_at: dailySession.opened_at,
    closed_at: dailySession.closed_at,
    notes: dailySession.notes,
    opened_by_user: {
      id: dailySession.opened_by_user_id,
      full_name: dailySession.opened_by_full_name,
      username: dailySession.opened_by_username,
    },
    closed_by_user: dailySession.closed_by_user_id
      ? {
          id: dailySession.closed_by_user_id,
          full_name: dailySession.closed_by_full_name,
          username: dailySession.closed_by_username,
        }
      : null,
    created_at: dailySession.created_at,
    updated_at: dailySession.updated_at,
  };
};

const toDailySessionsListResponse = (dailySessions = []) => {
  return dailySessions.map(toDailySessionResponse);
};

module.exports = {
  toDailySessionResponse,
  toDailySessionsListResponse,
};