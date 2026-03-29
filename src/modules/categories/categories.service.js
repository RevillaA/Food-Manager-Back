const ConflictError = require('../../common/errors/conflict-error');
const NotFoundError = require('../../common/errors/not-found-error');
const { getPagination } = require('../../common/utils/pagination.util');

const categoriesRepository = require('./categories.repository');

const createCategory = async (payload) => {
  const existingCategory = await categoriesRepository.findCategoryByName(payload.name);

  if (existingCategory) {
    throw new ConflictError('Category name is already in use');
  }

  const created = await categoriesRepository.createCategory({
    name: payload.name,
    category_type: payload.category_type,
    description: payload.description || null,
  });

  return categoriesRepository.findCategoryById(created.id);
};

const getCategories = async (queryParams) => {
  const { page, limit, offset } = getPagination(queryParams);

  const filters = {
    is_active:
      typeof queryParams.is_active === 'boolean' ? queryParams.is_active : undefined,
    category_type: queryParams.category_type || undefined,
  };

  const [categories, total] = await Promise.all([
    categoriesRepository.listCategories({ limit, offset, ...filters }),
    categoriesRepository.countCategories(filters),
  ]);

  return {
    data: categories,
    meta: {
      page,
      limit,
      total,
    },
  };
};

const getCategoryById = async (id) => {
  const category = await categoriesRepository.findCategoryById(id);

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category;
};

const updateCategory = async (id, payload) => {
  const currentCategory = await categoriesRepository.findCategoryById(id);

  if (!currentCategory) {
    throw new NotFoundError('Category not found');
  }

  if (payload.name && payload.name.toLowerCase() !== currentCategory.name.toLowerCase()) {
    const existingCategory = await categoriesRepository.findCategoryByName(payload.name);

    if (existingCategory) {
      throw new ConflictError('Category name is already in use');
    }
  }

  await categoriesRepository.updateCategory({
    id,
    name: payload.name ?? null,
    category_type: payload.category_type ?? null,
    description: payload.description ?? null,
  });

  return categoriesRepository.findCategoryById(id);
};

const updateCategoryStatus = async (id, is_active) => {
  const currentCategory = await categoriesRepository.findCategoryById(id);

  if (!currentCategory) {
    throw new NotFoundError('Category not found');
  }

  await categoriesRepository.updateCategoryStatus({ id, is_active });

  return categoriesRepository.findCategoryById(id);
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  updateCategoryStatus,
};