const ApiResponse = require('../../common/responses/api-response');
const PaginationResponse = require('../../common/responses/pagination-response');

const productsService = require('./products.service');
const productsMapper = require('./products.mapper');

const createProduct = async (req, res, next) => {
  try {
    const product = await productsService.createProduct(req.body);

    return ApiResponse.success({
      res,
      message: 'Product created successfully',
      data: productsMapper.toProductResponse(product),
      statusCode: 201,
    });
  } catch (error) {
    return next(error);
  }
};

const getProducts = async (req, res, next) => {
  try {
    const result = await productsService.getProducts(req.query);

    return PaginationResponse.send({
      res,
      message: 'Products retrieved successfully',
      data: productsMapper.toProductsListResponse(result.data),
      page: result.meta.page,
      limit: result.meta.limit,
      total: result.meta.total,
    });
  } catch (error) {
    return next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const product = await productsService.getProductById(req.params.id);

    return ApiResponse.success({
      res,
      message: 'Product retrieved successfully',
      data: productsMapper.toProductResponse(product),
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const product = await productsService.updateProduct(req.params.id, req.body);

    return ApiResponse.success({
      res,
      message: 'Product updated successfully',
      data: productsMapper.toProductResponse(product),
    });
  } catch (error) {
    return next(error);
  }
};

const updateProductStatus = async (req, res, next) => {
  try {
    const product = await productsService.updateProductStatus(
      req.params.id,
      req.body.is_active
    );

    return ApiResponse.success({
      res,
      message: 'Product status updated successfully',
      data: productsMapper.toProductResponse(product),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
};