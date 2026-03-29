const ApiResponse = require('../../common/responses/api-response');

const authService = require('./auth.service');
const authMapper = require('./auth.mapper');

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);

    return ApiResponse.success({
      res,
      message: 'Login successful',
      data: authMapper.toLoginResponse(result),
    });
  } catch (error) {
    return next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const user = await authService.getAuthenticatedUser(req.user.id);

    return ApiResponse.success({
      res,
      message: 'Authenticated user retrieved successfully',
      data: authMapper.toAuthenticatedUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  me,
};