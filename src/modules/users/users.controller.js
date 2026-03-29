const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const usersService = require('./users.service');
const usersMapper = require('./users.mapper');

const createUser = async (req, res, next) => {
  try {
    const user = await usersService.createUser(req.body);

    return ApiResponse.success({
      res,
      message: 'User created successfully',
      data: usersMapper.toUserResponse(user),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const result = await usersService.getUsers(req.query);

    return PaginationResponse.send({
      res,
      message: 'Users retrieved successfully',
      data: usersMapper.toUsersListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'User retrieved successfully',
      data: usersMapper.toUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'User updated successfully',
      data: usersMapper.toUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const user = await usersService.updateUserStatus(
      req.params.id,
      req.body.is_active
    );

    return ApiResponse.success({
      res,
      message: 'User status updated successfully',
      data: usersMapper.toUserResponse(user),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createUser,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
};