const ConflictError = require('../../common/errors/conflict-error');
const NotFoundError = require('../../common/errors/not-found-error');
const BadRequestError = require('../../common/errors/bad-request-error');
const { getPagination } = require('../../common/utils/pagination.util');

const productsRepository = require('./products.repository');
const categoriesRepository = require('../categories/categories.repository');

const createProduct = async (payload) => {
  const category = await categoriesRepository.findCategoryById(payload.category_id);

  if (!category) {
    throw new BadRequestError('Category does not exist');
  }

  if (!category.is_active) {
    throw new BadRequestError('Inactive categories cannot be used for new products');
  }

  const existingProduct = await productsRepository.findProductByCategoryAndName(
    payload.category_id,
    payload.name
  );

  if (existingProduct) {
    throw new ConflictError('Product name already exists in this category');
  }

  const created = await productsRepository.createProduct({
    category_id: payload.category_id,
    name: payload.name,
    description: payload.description || null,
    base_price: payload.base_price,
  });

  return productsRepository.findProductById(created.id);
};

const getProducts = async (queryParams) => {
  const { page, limit, offset } = getPagination(queryParams);

  const filters = {
    is_active:
      typeof queryParams.is_active === 'boolean' ? queryParams.is_active : undefined,
    category_id: queryParams.category_id || undefined,
  };

  const [products, total] = await Promise.all([
    productsRepository.listProducts({ limit, offset, ...filters }),
    productsRepository.countProducts(filters),
  ]);

  return {
    data: products,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getProductById = async (id) => {
  const product = await productsRepository.findProductById(id);

  if (!product) {
    throw new NotFoundError('Product not found');
  }

  return product;
};

const updateProduct = async (id, payload) => {
  const currentProduct = await productsRepository.findProductById(id);

  if (!currentProduct) {
    throw new NotFoundError('Product not found');
  }

  let targetCategoryId = currentProduct.category_id;

  if (payload.category_id) {
    const category = await categoriesRepository.findCategoryById(payload.category_id);

    if (!category) {
      throw new BadRequestError('Category does not exist');
    }

    if (!category.is_active) {
      throw new BadRequestError('Inactive categories cannot be used for products');
    }

    targetCategoryId = category.id;
  }

  const targetName = payload.name ?? currentProduct.name;

  if (
    targetCategoryId !== currentProduct.category_id ||
    targetName.toLowerCase() !== currentProduct.name.toLowerCase()
  ) {
    const existingProduct = await productsRepository.findProductByCategoryAndName(
      targetCategoryId,
      targetName
    );

    if (existingProduct && existingProduct.id !== id) {
      throw new ConflictError('Product name already exists in this category');
    }
  }

  await productsRepository.updateProduct({
    id,
    category_id: payload.category_id ?? null,
    name: payload.name ?? null,
    description: payload.description ?? null,
    base_price: payload.base_price ?? null,
  });

  return productsRepository.findProductById(id);
};

const updateProductStatus = async (id, is_active) => {
  const currentProduct = await productsRepository.findProductById(id);

  if (!currentProduct) {
    throw new NotFoundError('Product not found');
  }

  await productsRepository.updateProductStatus({ id, is_active });

  return productsRepository.findProductById(id);
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  updateProductStatus,
};