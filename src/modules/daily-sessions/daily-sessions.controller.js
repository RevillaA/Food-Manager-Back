const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const dailySessionsService = require('./daily-sessions.service');
const dailySessionsMapper = require('./daily-sessions.mapper');

const openDailySession = async (req, res, next) => {
  try {
    const dailySession = await dailySessionsService.openDailySession(req.body, req.user);

    return ApiResponse.success({
      res,
      message: 'Daily session opened successfully',
      data: dailySessionsMapper.toDailySessionResponse(dailySession),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const getActiveDailySession = async (req, res, next) => {
  try {
    const dailySession = await dailySessionsService.getActiveDailySession();

    return ApiResponse.success({
      res,
      message: 'Active daily session retrieved successfully',
      data: dailySessionsMapper.toDailySessionResponse(dailySession),
    });
  } catch (error) {
    return next(error);
  }
};

const getDailySessions = async (req, res, next) => {
  try {
    const result = await dailySessionsService.getDailySessions(req.query);

    return PaginationResponse.send({
      res,
      message: 'Daily sessions retrieved successfully',
      data: dailySessionsMapper.toDailySessionsListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getDailySessionById = async (req, res, next) => {
  try {
    const dailySession = await dailySessionsService.getDailySessionById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'Daily session retrieved successfully',
      data: dailySessionsMapper.toDailySessionResponse(dailySession),
    });
  } catch (error) {
    return next(error);
  }
};

const closeDailySession = async (req, res, next) => {
  try {
    const dailySession = await dailySessionsService.closeDailySession(
      req.params.id,
      req.body,
      req.user
    );

    return ApiResponse.success({
      res,
      message: 'Daily session closed successfully',
      data: dailySessionsMapper.toDailySessionResponse(dailySession),
    });
  } catch (error) {
    return next(error);
  }
};

const updateDailySessionStatus = async (req, res, next) => {
  try {
    const dailySession = await dailySessionsService.updateDailySessionStatus(
      req.params.id,
      req.body,
      req.user
    );

    return ApiResponse.success({
      res,
      message: 'Daily session status updated successfully',
      data: dailySessionsMapper.toDailySessionResponse(dailySession),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  openDailySession,
  getActiveDailySession,
  getDailySessions,
  getDailySessionById,
  closeDailySession,
  updateDailySessionStatus,
};