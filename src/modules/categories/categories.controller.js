const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const categoriesService = require('./categories.service');
const categoriesMapper = require('./categories.mapper');

const createCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.createCategory(req.body);

    return ApiResponse.success({
      res,
      message: 'Category created successfully',
      data: categoriesMapper.toCategoryResponse(category),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const result = await categoriesService.getCategories(req.query);

    return PaginationResponse.send({
      res,
      message: 'Categories retrieved successfully',
      data: categoriesMapper.toCategoriesListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getCategoryById = async (req, res, next) => {
  try {
    const category = await categoriesService.getCategoryById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'Category retrieved successfully',
      data: categoriesMapper.toCategoryResponse(category),
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategory(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Category updated successfully',
      data: categoriesMapper.toCategoryResponse(category),
    });
  } catch (error) {
    return next(error);
  }
};

const updateCategoryStatus = async (req, res, next) => {
  try {
    const category = await categoriesService.updateCategoryStatus(
      req.params.id,
      req.body.is_active
    );

    return ApiResponse.success({
      res,
      message: 'Category status updated successfully',
      data: categoriesMapper.toCategoryResponse(category),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
};